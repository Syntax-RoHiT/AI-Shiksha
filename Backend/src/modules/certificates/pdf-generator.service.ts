import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';

interface CertificateData {
    studentName: string;
    courseName: string;
    instructorName: string;
    completionDate: string;
    completionTime: string;
    certificateNumber: string;
    qrValidationUrl: string;
}

interface CertificateElement {
    id: string;
    type: 'text' | 'variable' | 'image' | 'qrcode';
    x: number;
    y: number;
    width?: number;
    height?: number;
    content: string;
    style: {
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string | number;
        fontStyle?: string;
        color?: string;
        textAlign?: 'left' | 'center' | 'right';
        opacity?: number;
        textTransform?: string;
        letterSpacing?: number;
        lineHeight?: number;
    };
}

interface TemplateConfig {
    canvas: {
        width: number;
        height: number;
        backgroundColor: string;
        backgroundImage?: string;
    };
    elements: CertificateElement[];
}

@Injectable()
export class PdfGeneratorService {
    private readonly logger = new Logger(PdfGeneratorService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Generate PDF certificate from template and data
     */
    async generateCertificatePDF(
        certificateId: string,
    ): Promise<Buffer> {
        this.logger.log(`Generating PDF for certificate ID: ${certificateId}`);

        try {
            // Fetch certificate with all related data
            const certificate = await this.prisma.certificate.findUnique({
                where: { id: certificateId },
                include: {
                    user: {
                        select: {
                            name: true,
                        },
                    },
                    course: {
                        select: {
                            title: true,
                            certificate_template_id: true,
                            certificate_template: {
                                select: {
                                    template_config: true,
                                },
                            },
                            instructor: {
                                select: {
                                    user: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!certificate) {
                throw new Error('Certificate not found');
            }

            // Fetch enrollment to get completion time/duration
            const enrollment = await this.prisma.enrollment.findUnique({
                where: {
                    student_id_course_id: {
                        student_id: certificate.student_id,
                        course_id: certificate.course_id,
                    }
                }
            });

            // Calculate duration string (e.g., "10h 30m" or from course estimated duration)
            // Using enrollment total_learning_time (minutes) or fallback
            const durationMinutes = enrollment?.total_learning_time || 0;
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            const durationString = durationMinutes > 0
                ? `${hours > 0 ? `${hours}h ` : ''}${minutes}m`
                : 'Self-paced';

            // Prepare certificate data
            const certData: CertificateData = {
                studentName: certificate.user.name,
                courseName: certificate.course.title,
                instructorName: certificate.course.instructor?.user?.name || 'Instructor',
                completionDate: new Date(certificate.issued_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                completionTime: durationString,
                certificateNumber: certificate.certificate_number,
                qrValidationUrl: certificate.qr_validation_url || '',
            };

            // Get template config
            let templateConfig = certificate.course.certificate_template?.template_config as any as TemplateConfig;

            if (!templateConfig || !templateConfig.elements || templateConfig.elements.length === 0) {
                // Provide a default template if none is configured
                templateConfig = {
                    canvas: { width: 800, height: 600, backgroundColor: '#ffffff' },
                    elements: [
                        { id: '1', type: 'text', x: 400, y: 100, content: 'CERTIFICATE OF COMPLETION', style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#1a365d' } },
                        { id: '2', type: 'text', x: 400, y: 180, content: 'This is proudly presented to', style: { fontSize: 16, textAlign: 'center', color: '#4a5568' } },
                        { id: '3', type: 'variable', x: 400, y: 250, content: '{student_name}', style: { fontSize: 40, fontWeight: 'bold', textAlign: 'center', color: '#a435f0', fontFamily: 'Georgia, serif' } },
                        { id: '4', type: 'text', x: 400, y: 320, content: 'For successfully completing the course', style: { fontSize: 16, textAlign: 'center', color: '#4a5568' } },
                        { id: '5', type: 'variable', x: 400, y: 380, content: '{course_name}', style: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#2d3748' } },
                        { id: '6', type: 'variable', x: 400, y: 440, content: 'By {instructor_name}', style: { fontSize: 16, textAlign: 'center', color: '#4a5568' } },
                        { id: '7', type: 'variable', x: 200, y: 520, content: 'Date: {completion_date}', style: { fontSize: 14, textAlign: 'left', color: '#718096' } },
                        { id: '8', type: 'variable', x: 600, y: 520, content: 'ID: {certificate_number}', style: { fontSize: 14, textAlign: 'right', color: '#718096' } },
                        { id: '9', type: 'qrcode', x: 400, y: 520, width: 80, height: 80, content: '{qr_validation_url}', style: {} }
                    ]
                };
            }

            // Generate HTML for certificate
            const html = await this.generateCertificateHTML(templateConfig, certData);

            // Generate PDF using Puppeteer
            const pdfBuffer = await this.htmlToPDF(html, templateConfig.canvas.width, templateConfig.canvas.height);

            this.logger.log(`PDF generated successfully for certificate ID: ${certificateId}`);
            return pdfBuffer;
        } catch (error) {
            this.logger.error(`Error generating PDF: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Generate HTML from template config and certificate data
     */
    private async generateCertificateHTML(
        templateConfig: TemplateConfig,
        certData: CertificateData,
    ): Promise<string> {
        // Generate QR code as data URL
        let qrCodeDataUrl = '';
        if (certData.qrValidationUrl) {
            qrCodeDataUrl = await QRCode.toDataURL(certData.qrValidationUrl, {
                width: 300,
                margin: 1,
                errorCorrectionLevel: 'H',
            });
        }

        // Replace variables in template elements
        const processedElements = templateConfig.elements.map((element) => {
            let content = element.content;

            // Replace placeholders with actual data
            content = content.replace('{student_name}', certData.studentName);
            content = content.replace('{course_name}', certData.courseName);
            content = content.replace('{instructor_name}', certData.instructorName);
            content = content.replace('{completion_date}', certData.completionDate);
            content = content.replace('{completion_time}', certData.completionTime);
            content = content.replace('{certificate_number}', certData.certificateNumber);
            content = content.replace('{qr_validation_url}', certData.qrValidationUrl);

            return { ...element, content };
        });

        // Generate HTML elements
        const elementsHTML = processedElements
            .map((element) => {
                if (element.type === 'qrcode') {
                    return `
            <div style="
              position: absolute;
              left: ${element.x}px;
              top: ${element.y}px;
              width: ${element.width || 100}px;
              height: ${element.height || 100}px;
              transform: translate(-50%, -50%);
            ">
              <img src="${qrCodeDataUrl}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          `;
                } else if (element.type === 'image') {
                    return `
            <div style="
              position: absolute;
              left: ${element.x}px;
              top: ${element.y}px;
              width: ${element.width || 100}px;
              height: ${element.height || 100}px;
              transform: translate(-50%, -50%);
              opacity: ${element.style.opacity || 1};
            ">
              <img src="${element.content}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          `;
                } else {
                    // Text or variable element
                    return `
            <div style="
              position: absolute;
              left: ${element.x}px;
              top: ${element.y}px;
              transform: translate(-50%, -50%);
              font-family: ${element.style.fontFamily || 'Arial, sans-serif'};
              font-size: ${element.style.fontSize || 16}px;
              font-weight: ${element.style.fontWeight || 'normal'};
              font-style: ${element.style.fontStyle || 'normal'};
              color: ${element.style.color || '#000000'};
              text-align: ${element.style.textAlign || 'left'};
              opacity: ${element.style.opacity || 1};
              ${element.style.textTransform ? `text-transform: ${element.style.textTransform};` : ''}
              ${element.style.letterSpacing ? `letter-spacing: ${element.style.letterSpacing}px;` : ''}
              ${element.style.lineHeight ? `line-height: ${element.style.lineHeight};` : ''}
              white-space: nowrap;
            ">
              ${element.content}
            </div>
          `;
                }
            })
            .join('\n');

        // Build complete HTML
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Georgia:wght@400;700&family=Inter:wght@400;600;700&family=Roboto:wght@400;600;700&family=Times+New+Roman&display=swap');
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          <div style="
            position: relative;
            width: ${templateConfig.canvas.width}px;
            height: ${templateConfig.canvas.height}px;
            background-color: ${templateConfig.canvas.backgroundColor};
            ${templateConfig.canvas.backgroundImage ? `background-image: url(${templateConfig.canvas.backgroundImage}); background-size: cover; background-position: center;` : ''}
            overflow: hidden;
          ">
            ${elementsHTML}
          </div>
        </body>
      </html>
    `;

        return html;
    }

    /**
     * Convert HTML to PDF using Puppeteer
     */
    private async htmlToPDF(
        html: string,
        width: number,
        height: number,
    ): Promise<Buffer> {
        let browser: puppeteer.Browser | null = null;

        try {
            // Launch browser
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer'
                ],
            });

            const page = await browser.newPage();

            // Set viewport to match certificate dimensions
            await page.setViewport({
                width,
                height,
                deviceScaleFactor: 2, // High DPI for better quality
            });

            // Set content
            await page.setContent(html, {
                waitUntil: 'domcontentloaded',
            });
            await page.evaluateHandle('document.fonts.ready');

            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                preferCSSPageSize: true,
            });

            return Buffer.from(pdfBuffer);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
