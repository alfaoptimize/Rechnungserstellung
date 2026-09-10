function getDefaultData() {
  return {
    sender: '',
    client: '',
    docNumber: 'RE-2026-001',
    taxRate: 19,
    paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
    accountHolder: '',
    iban: '',
    bic: '',
    taxId: '',
    contact: '',
    items: [
      { id: '1', desc: 'Google Apps Script Automatisierung', qty: 5, price: 95.00 },
      { id: '2', desc: 'Workflow Beratung & Konzept', qty: 2, price: 120.00 }
    ]
  };
}

let invoiceData = getDefaultData();

// DOM Elemente
const senderInput = document.getElementById('senderInfo');
const clientInput = document.getElementById('clientInfo');
const docNumberInput = document.getElementById('docNumber');
const taxRateInput = document.getElementById('taxRate');
const paymentTermsInput = document.getElementById('paymentTermsInput');
const accountHolderInput = document.getElementById('accountHolderInput');
const ibanInput = document.getElementById('ibanInput');
const bicInput = document.getElementById('bicInput');
const taxIdInput = document.getElementById('taxIdInput');
const contactInput = document.getElementById('contactInput');
const addItemForm = document.getElementById('addItemForm');

document.addEventListener('DOMContentLoaded', () => {
  initFormValues();
  renderInvoice();
  setupEventListeners();
});

function initFormValues() {
  senderInput.value = invoiceData.sender;
  clientInput.value = invoiceData.client;
  docNumberInput.value = invoiceData.docNumber;
  taxRateInput.value = invoiceData.taxRate;
  paymentTermsInput.value = invoiceData.paymentTerms;
  accountHolderInput.value = invoiceData.accountHolder;
  ibanInput.value = invoiceData.iban;
  bicInput.value = invoiceData.bic;
  taxIdInput.value = invoiceData.taxId;
  contactInput.value = invoiceData.contact;

  // Datum im Format dd.MM.yyyy
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  document.getElementById('previewDate').textContent = `${day}.${month}.${year}`;

  updateFooter();
}

function setupEventListeners() {
  senderInput.addEventListener('input', (e) => {
    invoiceData.sender = e.target.value;
    updateSenderAndAddress(e.target.value);
  });

  clientInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    invoiceData.client = e.target.value;
    document.getElementById('previewClient').textContent = val !== '' ? e.target.value : 'Empfänger GmbH';
  });

  docNumberInput.addEventListener('input', (e) => {
    invoiceData.docNumber = e.target.value;
    document.getElementById('previewDocNumber').textContent = `Nr.: ${e.target.value}`;
  });

  taxRateInput.addEventListener('input', (e) => {
    invoiceData.taxRate = parseFloat(e.target.value) || 0;
    document.getElementById('previewTaxRate').textContent = invoiceData.taxRate;
    renderInvoice();
  });

  paymentTermsInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    invoiceData.paymentTerms = e.target.value;
    document.getElementById('previewPaymentTerms').textContent = val !== '' ? e.target.value : 'Zahlbar innerhalb von 14 Tagen ohne Abzug.';
  });

  accountHolderInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    invoiceData.accountHolder = e.target.value;
    document.getElementById('footerAccountHolder').textContent = val !== '' ? e.target.value : 'Absender GmbH / Vorname Nachname';
  });

  ibanInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    invoiceData.iban = e.target.value;
    document.getElementById('footerIban').textContent = val !== '' ? e.target.value : 'DE12 1234 5678 1234 5678 90';
  });

  bicInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    invoiceData.bic = e.target.value;
    document.getElementById('footerBic').textContent = val !== '' ? e.target.value : 'BANKDEFFXXX';
  });

  taxIdInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    invoiceData.taxId = e.target.value;
    document.getElementById('footerTaxId').textContent = val !== '' ? e.target.value : 'DE123456789';
  });

  contactInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    invoiceData.contact = e.target.value;
    document.getElementById('footerContact').textContent = val !== '' ? e.target.value : 'info@absender.de';
  });

  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('itemDesc').value.trim();
    const qty = parseFloat(document.getElementById('itemQty').value);
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!desc || isNaN(qty) || isNaN(price)) return;

    invoiceData.items.push({ id: Date.now().toString(), desc, qty, price });
    document.getElementById('itemDesc').value = '';
    renderInvoice();
  });

  document.getElementById('downloadPdfBtn').addEventListener('click', generatePdf);
}

// Spiegelt den Absender-Input in Vorschau-Kopfzeile und Fußzeile
function updateSenderAndAddress(inputVal) {
  const val = inputVal.trim();
  const previewSenderEl = document.getElementById('previewSender');
  const footerCompanyEl = document.getElementById('footerCompany');
  const footerAddressEl = document.getElementById('footerAddress');

  if (val === '') {
    previewSenderEl.textContent = 'Absender GmbH';
    footerCompanyEl.textContent = 'Absender GmbH';
    footerAddressEl.textContent = 'Musterstraße 1\n12345 Musterstadt';
    return;
  }

  previewSenderEl.textContent = val;

  // Aufteilen nach Kommas oder Zeilenumbrüchen
  const parts = val.split(/,|\n/).map(p => p.trim()).filter(p => p.length > 0);

  if (parts.length > 0) {
    footerCompanyEl.textContent = parts[0]; // Erster Teil = Firmenname / Name
  }
  if (parts.length > 1) {
    footerAddressEl.textContent = parts.slice(1).join('\n'); // Restliche Teile = Adresse
  } else {
    footerAddressEl.textContent = '';
  }
}

function renderInvoice() {
  const tableBody = document.getElementById('invoiceItemsTable');
  tableBody.innerHTML = '';

  let subTotal = 0;

  invoiceData.items.forEach((item, index) => {
    const total = item.qty * item.price;
    subTotal += total;

    const row = document.createElement('tr');
    row.className = 'text-slate-700 text-xs';
    row.innerHTML = `
      <td class="py-2.5 font-medium">${index + 1}</td>
      <td class="py-2.5">${escapeHtml(item.desc)}</td>
      <td class="py-2.5 text-right">${item.qty}</td>
      <td class="py-2.5 text-right">${formatCurrency(item.price)}</td>
      <td class="py-2.5 text-right font-medium">${formatCurrency(total)}</td>
      <td class="py-2.5 text-right action-col">
        <button onclick="removeItem('${item.id}')" class="text-rose-500 hover:text-rose-700 font-bold px-1">✕</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  const taxTotal = subTotal * (invoiceData.taxRate / 100);
  const grandTotal = subTotal + taxTotal;

  document.getElementById('subTotal').textContent = formatCurrency(subTotal);
  document.getElementById('taxTotal').textContent = formatCurrency(taxTotal);
  document.getElementById('grandTotal').textContent = formatCurrency(grandTotal);
}

function updateFooter() {
  updateSenderAndAddress(invoiceData.sender);
  document.getElementById('footerContact').textContent = invoiceData.contact || 'info@absender.de';
  document.getElementById('footerTaxId').textContent = invoiceData.taxId || 'DE123456789';
  document.getElementById('footerAccountHolder').textContent = invoiceData.accountHolder || 'Absender GmbH / Vorname Nachname';
  document.getElementById('footerIban').textContent = invoiceData.iban || 'DE12 1234 5678 1234 5678 90';
  document.getElementById('footerBic').textContent = invoiceData.bic || 'BANKDEFFXXX';
}

function removeItem(id) {
  invoiceData.items = invoiceData.items.filter(item => item.id !== id);
  renderInvoice();
}

function generatePdf() {
  const element = document.getElementById('invoicePreview');
  element.classList.add('generating-pdf');

  const opt = {
    margin: 8,
    filename: `${invoiceData.docNumber || 'Rechnung'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    element.classList.remove('generating-pdf');
  });
}

function formatCurrency(amount) {
  return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

window.removeItem = removeItem;
