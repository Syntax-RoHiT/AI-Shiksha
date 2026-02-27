import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { FranchisesService } from './src/modules/franchises/franchises.service';
import { CertificateTemplatesService } from './src/modules/certificate-templates/certificate-templates.service';

async function bootstrap() {
    console.log('--- Starting Certificate Generation Test ---');
    const app = await NestFactory.createApplicationContext(AppModule);
    const franchisesService = app.get(FranchisesService);
    const certTemplatesService = app.get(CertificateTemplatesService);

    try {
        const testDomain = `test-${Date.now()}.com`;

        console.log(`Creating dummy franchise with domain: ${testDomain}`);
        const result = await franchisesService.create({
            name: 'Test Franchise Certs',
            domain: testDomain,
            admin_name: 'Cert Admin',
            admin_email: `admin@${testDomain}`,
            lms_name: 'Cert LMS UI',
            primary_color: '#000000',
            support_email: `support@${testDomain}`,
        });

        const franchiseId = result.franchise.id;
        console.log(`✅ Franchise created with ID: ${franchiseId}`);

        console.log(`Fetching certificate templates for franchise...`);
        const templates = await certTemplatesService.findAll(franchiseId);

        console.log(`Found ${templates.length} templates scoped to franchise.`);
        if (templates.length >= 2) {
            console.log('✅ Auto-generation logic looks successful!');
            console.log(JSON.stringify(templates.map(t => t.name), null, 2));
        } else {
            console.log('❌ Failed to find the expected auto-generated templates.');
        }

        console.log('Fetching default template explicitely...');
        const defaultTemplate = await certTemplatesService.getDefault(franchiseId);
        if (defaultTemplate && defaultTemplate.is_default) {
            console.log(`✅ Default template resolved: ${defaultTemplate.name}`);
        } else {
            console.log('❌ Failed to resolve the default template correctly.');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await app.close();
    }
}

bootstrap();
