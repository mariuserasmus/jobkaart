import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'

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
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
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
})

interface QuotePDFProps {
  quote: {
    quote_number: string
    created_at: string
    valid_until?: string | null
    subtotal: number
    vat_amount: number
    total: number
    notes?: string | null
    terms?: string | null
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
    logo_url?: string | null
  }
}

export const QuotePDF: React.FC<QuotePDFProps> = ({ quote, tenant }) => {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
        <Text style={styles.title}>QUOTATION</Text>

        {/* Quote Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Quote Number:</Text>
            <Text style={styles.value}>{quote.quote_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formatDate(quote.created_at)}</Text>
          </View>
          {quote.valid_until && (
            <View style={styles.row}>
              <Text style={styles.label}>Valid Until:</Text>
              <Text style={styles.value}>{formatDate(quote.valid_until)}</Text>
            </View>
          )}
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{quote.customers.name}</Text>
          </View>
          {quote.customers.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{quote.customers.phone}</Text>
            </View>
          )}
          {quote.customers.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{quote.customers.email}</Text>
            </View>
          )}
          {quote.customers.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{quote.customers.address}</Text>
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
          {quote.line_items.map((item, index) => (
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
            <Text style={styles.totalValue}>{formatCurrency(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT (15%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(quote.vat_amount)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total:</Text>
            <Text>{formatCurrency(quote.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {quote.terms && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Terms & Conditions:</Text>
            <Text style={styles.notesText}>{quote.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This quote is valid until {quote.valid_until ? formatDate(quote.valid_until) : '30 days from issue date'}
          </Text>
          <Text style={styles.footerText}>
            Please contact us if you have any questions about this quote.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
