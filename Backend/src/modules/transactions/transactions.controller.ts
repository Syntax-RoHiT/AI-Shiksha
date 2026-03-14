import { Controller, Get, Post, Body, Param, Request, UseGuards, Res } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { InvoicesService } from '../invoices/invoices.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly transactionsService: TransactionsService,
        private readonly invoicesService: InvoicesService
    ) { }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my transaction history' })
    getMyTransactions(@Request() req) {
        const userId = req.user.userId;
        return this.transactionsService.getMyTransactions(userId);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new transaction (Purchase)' })
    createTransaction(@Request() req, @Body() body: { 
        courseIds: string[], 
        amount: number, 
        paymentMethod: string,
        billingDetails?: any 
    }) {
        const userId = req.user.userId;
        return this.transactionsService.createTransaction(userId, body);
    }

    @Get('stats')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get transaction statistics' })
    getTransactionStats(@Request() req) {
        const userId = req.user.userId;
        return this.transactionsService.getTransactionStats(userId);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get transaction by ID' })
    getTransactionById(@Param('id') id: string, @Request() req) {
        const userId = req.user.userId;
        return this.transactionsService.getTransactionById(id, userId);
    }

    @Get(':id/invoice')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download PDF Invoice' })
    async downloadInvoice(@Param('id') id: string, @Res() res: Response) {
        const pdfBuffer = await this.invoicesService.generateInvoicePdf(id);
        
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Invoice-${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }
}
