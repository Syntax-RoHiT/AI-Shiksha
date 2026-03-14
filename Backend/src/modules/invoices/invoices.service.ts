import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class InvoicesService {
    private readonly logger = new Logger(InvoicesService.name);

    constructor(
        private prisma: PrismaService,
        private mailerService: MailerService
    ) {}

    async generateInvoicePdf(paymentId: string): Promise<Buffer> {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { user: true, course: true, franchise: true }
        });

        if (!payment) throw new Error("Payment not found");

        const p: any = payment;

        const templatePath = path.join(process.cwd(), 'src/templates/invoice.ejs');
        
        // Ensure template exists or fallback to basic HTML
        let html: string;
        if (fs.existsSync(templatePath)) {
            const templateString = fs.readFileSync(templatePath, 'utf-8');
            html = ejs.render(templateString, { payment });
        } else {
            // Fallback inline template
            html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
                        .title { font-size: 28px; font-weight: bold; color: #111; }
                        .details { margin-bottom: 40px; }
                        .table { w-full; border-collapse: collapse; margin-top: 20px; width: 100%; }
                        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        .table th { background-color: #f9f9f9; }
                        .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; }
                        .footer { margin-top: 50px; font-size: 12px; color: #777; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="title">INVOICE</div>
                            <div>Transaction ID: ${p.transaction_id || p.id}</div>
                            <div>Date: ${new Date(p.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style="text-align: right;">
                            <strong>${p.franchise ? p.franchise.name : 'LMS SaaS'}</strong><br/>
                            Payment Receipt
                        </div>
                    </div>

                    <div class="details" style="display: flex; justify-content: space-between;">
                        <div>
                            <strong>Billed To:</strong><br/>
                            ${p.billing_name || p.user?.name || 'Customer'}<br/>
                            ${p.billing_email || p.user?.email || ''}<br/>
                            ${p.billing_address || ''}<br/>
                            ${p.billing_city || ''} ${p.billing_zip || ''}<br/>
                            ${p.billing_country || ''}
                        </div>
                        <div style="text-align: right;">
                            <strong>Status:</strong> <span style="color: ${p.payment_status === 'completed' ? 'green' : 'orange'}">${p.payment_status.toUpperCase()}</span><br/>
                            <strong>Method:</strong> ${p.payment_provider.toUpperCase()}
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th style="text-align: right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Course: ${p.course?.title || 'Course Access'}</td>
                                <td style="text-align: right">INR ${p.amount.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="total">
                        Total Paid: INR ${p.amount.toLocaleString()}
                    </div>

                    <div class="footer">
                        Thank you for learning with us! <br/>
                        For any queries, please reply to this email or contact support.
                    </div>
                </body>
            </html>`;
        }

        const browser = await puppeteer.launch({ 
            headless: true, 
             args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
             executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined // Allow system chrome if needed
        });
        
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
            await browser.close();
            return Buffer.from(pdfBuffer);
        } catch (error) {
            await browser.close();
            this.logger.error('Failed to generate PDF', error);
            throw error;
        }
    }

    async sendInvoiceEmail(paymentId: string) {
        try {
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId },
                include: { user: true, course: true, franchise: true }
            });

            if (!payment) return;
            const p: any = payment;

            const pdfBuffer = await this.generateInvoicePdf(paymentId);
            const userEmail = p.billing_email || p.user?.email;
            const lmsName = p.franchise ? p.franchise.name : 'LMS SaaS';

            if (!userEmail) {
                this.logger.error(`No email found for payment ${paymentId}`);
                return;
            }

            const courseTitle = p.course?.title || 'your course';
            const customerName = p.billing_name || p.user?.name || 'Customer';

            await this.mailerService.sendMail({
                to: userEmail,
                subject: `Your Invoice for ${courseTitle} from ${lmsName}`,
                text: `Dear ${customerName},\n\nThank you for your purchase! The invoice for your recent enrollment in "${courseTitle}" is attached to this email.\n\nBest regards,\nThe ${lmsName} Team`,
                attachments: [
                    {
                        filename: `Invoice-${payment.transaction_id || payment.id}.pdf`,
                        content: pdfBuffer,
                    }
                ]
            });
            this.logger.log(`Invoice email sent for payment ${paymentId} to ${userEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send invoice email for payment ${paymentId}`, error);
        }
    }
}
