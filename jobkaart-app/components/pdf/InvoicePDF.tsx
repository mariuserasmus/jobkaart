import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    maxHeight: 50,
    maxWidth: 150,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#dc2626',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  value: {
    flex: 1,
    color: '#111',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '2px solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  totals: {
    marginTop: 10,
    marginLeft: 'auto',
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 2,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    textAlign: 'right',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '2px solid #374151',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400e',
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  paymentLabel: {
    width: 100,
    fontSize: 10,
    color: '#78350f',
  },
  paymentValue: {
    flex: 1,
    fontSize: 10,
    color: '#78350f',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
    textAlign: 'center',
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderLeft: '3px solid #2563eb',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  statusBadge: {
    position: 'absolute',
    top: 40,
    right: 40,
    padding: 8,
    backgroundColor: '#fee2e2',
    border: '2px solid #dc2626',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
  },
})

interface InvoicePDFProps {
  invoice: {
    invoice_number: string
    created_at: string
    due_date: string
    subtotal: number
    vat_amount: number
    total: number
    paid_amount: number
    outstanding_amount: number
    status: string
    notes?: string | null
    line_items: Array<{
      description: string
      quantity: number
      unit_price: number
      total: number
    }>
    customers: {
      name: string
      phone?: string | null
      email?: string | null
      address?: string | null
    }
  }
  tenant: {
    company_name: string
    phone?: string | null
    email?: string | null
    address?: string | null
    bank_name?: string | null
    bank_account_number?: string | null
    bank_branch_code?: string | null
    logo_url?: string | null
  }
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, tenant }) => {
  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isOverdue = () => {
    const dueDate = new Date(invoice.due_date)
    const today = new Date()
    return invoice.outstanding_amount > 0 && dueDate < today
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Overdue Badge */}
        {isOverdue() && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>OVERDUE</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{tenant.company_name}</Text>
            {tenant.phone && (
              <Text style={styles.companyDetails}>Tel: {tenant.phone}</Text>
            )}
            {tenant.email && (
              <Text style={styles.companyDetails}>Email: {tenant.email}</Text>
            )}
            {tenant.address && (
              <Text style={styles.companyDetails}>{tenant.address}</Text>
            )}
          </View>
          {tenant.logo_url && (
            <Image src={tenant.logo_url} style={styles.logo} />
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>INVOICE</Text>

        {/* Invoice Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Number:</Text>
            <Text style={styles.value}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.created_at)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{invoice.customers.name}</Text>
          </View>
          {invoice.customers.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{invoice.customers.phone}</Text>
            </View>
          )}
          {invoice.customers.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{invoice.customers.email}</Text>
            </View>
          )}
          {invoice.customers.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{invoice.customers.address}</Text>
            </View>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Unit Price</Text>
            <Text style={styles.col4}>Total</Text>
          </View>
          {invoice.line_items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.col4}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT (15%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.vat_amount)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total:</Text>
            <Text>{formatCurrency(invoice.total)}</Text>
          </View>
          {invoice.paid_amount > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Paid:</Text>
                <Text style={styles.totalValue}>
                  -{formatCurrency(invoice.paid_amount)}
                </Text>
              </View>
              <View style={styles.grandTotal}>
                <Text>Amount Due:</Text>
                <Text>{formatCurrency(invoice.outstanding_amount)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Payment Details:</Text>
          {tenant.bank_name && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Bank:</Text>
              <Text style={styles.paymentValue}>{tenant.bank_name}</Text>
            </View>
          )}
          {tenant.bank_account_number && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Account No:</Text>
              <Text style={styles.paymentValue}>{tenant.bank_account_number}</Text>
            </View>
          )}
          {tenant.bank_branch_code && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Branch Code:</Text>
              <Text style={styles.paymentValue}>{tenant.bank_branch_code}</Text>
            </View>
          )}
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Reference:</Text>
            <Text style={styles.paymentValue}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Payment is due by {formatDate(invoice.due_date)}
          </Text>
          <Text style={styles.footerText}>
            Please use the invoice number as payment reference.
          </Text>
          <Text style={styles.footerText}>
            Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  )
}
