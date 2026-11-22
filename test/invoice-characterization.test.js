const { test } = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');
const reports = require('../lib/reports');

test('invoice matches checkout GST, coupon discount, and total for the reported orders', () => {
  const order1002 = makeOrder({
    id: 1002,
    customer: 'Anil Kulkarni',
    items: [
      { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 640, qty: 1 },
      { id: 4, sku: 'OIL-001', name: 'Oil', hsn: '1512', price: 190, qty: 2 }
    ],
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    total: 963.9
  });
  const order1004 = makeOrder({
    id: 1004,
    items: [{ id: 5, sku: 'OIL-002', name: 'Oil', hsn: '1508', price: 1120, qty: 2 }],
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5
  });
  const order1001 = makeOrder({
    id: 1001,
    coupon: '',
    items: [
      { id: 8, sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 140, qty: 2 },
      { id: 2, sku: 'GRN-002', name: 'Dal', hsn: '0713', price: 165, qty: 2 }
    ],
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    total: 676.9
  });
  const order1007 = makeOrder({
    id: 1007,
    coupon: '',
    items: [
      { id: 6, sku: 'DRY-001', name: 'Ghee', hsn: '0405', price: 450, qty: 2 },
      { id: 4, sku: 'OIL-001', name: 'Oil', hsn: '1512', price: 190, qty: 2 }
    ],
    subtotal: 1280,
    discount: 0,
    tax: 127,
    total: 1407
  });
  const order1008 = makeOrder({
    id: 1008,
    coupon: '',
    items: [
      { id: 8, sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 140, qty: 1 },
      { id: 12, sku: 'BEV-003', name: 'Sherbet', hsn: '2106', price: 180, qty: 2 }
    ],
    subtotal: 500,
    discount: 0,
    tax: 90,
    total: 590
  });

  for (const order of [order1002, order1004, order1001, order1007, order1008]) {
    const calculated = invoice.computeInvoiceFigures(order);
    assert.equal(calculated.discount, order.discount, `order #${order.id} discount`);
    assert.equal(calculated.tax, order.tax, `order #${order.id} GST`);
    assert.equal(calculated.total, order.total, `order #${order.id} total`);
  }
});

function makeOrder(overrides = {}) {
  return {
    id: 7001,
    date: '22/11/2026',
    customer: 'In-memory customer',
    paymentMode: 'cash',
    status: 'completed',
    items: [{ id: 1, sku: 'TEST-1', name: 'Test rice', hsn: '1006', price: 1000, qty: 1 }],
    coupon: 'SAVE10',
    subtotal: 1000,
    discount: 100,
    tax: 45,
    total: 945,
    ...overrides
  };
}

test('CURRENT BEHAVIOUR: order pricing applies HSN GST after proportional coupon discount', () => {
  const order = makeOrder();
  const totals = pricing.computeTotals(order.items, order.coupon);

  assert.equal(totals.subtotal, 1000);
  assert.equal(totals.discount, 100);
  assert.equal(totals.tax, 45);
  assert.equal(totals.cgst, 22.5);
  assert.equal(totals.sgst, 22.5);
  assert.equal(totals.total, 945);
  assert.deepEqual(totals.lines[0], {
    id: 1,
    name: 'Test rice',
    hsn: '1006',
    gstPercent: 5,
    gross: 1000,
    discount: 100,
    taxable: 900,
    tax: 45,
    net: 945
  });
});

test('invoice uses HSN GST and applies the coupon to the same taxable base as checkout', () => {
  const figures = invoice.computeInvoiceFigures(makeOrder());

  assert.equal(figures.subtotal, 1000);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, 45);
  assert.equal(figures.discount, 100);
  assert.equal(figures.cgst, 22.5);
  assert.equal(figures.sgst, 22.5);
  assert.equal(figures.total, 945);
});

test('reconciliation matches the stored checkout figures', () => {
  const order = makeOrder();
  const result = reports.getGstReconciliation({ orders: [order] });

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  assert.equal(result.rows[0].ledgerTax, 45);
  assert.equal(result.rows[0].invoiceTax, 45);
  assert.equal(result.rows[0].ledgerTotal, 945);
  assert.equal(result.rows[0].invoiceTotal, 945);
  assert.equal(result.rows[0].delta, 0);
  assert.equal(result.rows[0].matched, true);
});

test('rendered invoice shows the corrected figures without a mismatch notice', () => {
  const html = invoice.render(makeOrder());

  assert.match(html, /5%/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
  assert.match(html, /45\.00/);
  assert.match(html, /945\.00/);
});
