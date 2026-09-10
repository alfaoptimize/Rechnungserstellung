// Funktion zum Erzeugen der initialen Standarddaten
function getDefaultData() {
  return {
    sender: '',
    client: '',
    docNumber: 'RE-2026-001',
    taxRate: 19,
    items: [
      { id: '1', desc: 'Google Apps Script Automatisierung', qty: 5, price: 95.00 },
      { id: '2', desc: 'Workflow Beratung & Konzept', qty: 2, price: 120.00 }
    ]
  };
}

// Initialer Status (wird bei jedem Seitenaufruf neu erzeugt)
let invoiceData = getDefaultData();

// DOM Elemente
const senderInput = document.getElementById('senderInfo');
const clientInput = document.getElementById('clientInfo');
const docNumberInput = document.getElementById('docNumber');
const taxRateInput = document.getElementById('taxRate');
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

  // Datum als dd.MM.yyyy formatieren
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  document.getElementById('previewDate').textContent = `${day}.${month}.${year}`;

  // Vorschau-Standardtexte festlegen
  document.getElementById('previewSender').textContent = invoiceData.sender || 'Absender GmbH';
  document.getElementById('previewClient').textContent = invoiceData.client || 'Empfänger GmbH';
}

function setupEventListeners() {
  senderInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    invoiceData.sender = e.target.value;
    document.getElementById('previewSender').textContent = val !== '' ? e.target.value : 'Absender GmbH';
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

  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('itemDesc').value.trim();
    const qty = parseFloat(document.getElementById('itemQty').value);
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!desc || isNaN(qty) || isNaN(price)) return;

    invoiceData.items.push({
      id: Date.now().toString(),
      desc,
      qty,
      price
    });

    document.getElementById('itemDesc').value = '';
    renderInvoice();
  });

  document.getElementById('downloadPdfBtn').addEventListener('click', generatePdf);
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

function removeItem(id) {
  invoiceData.items = invoiceData.items.filter(item => item.id !== id);
  renderInvoice();
}

function generatePdf() {
  const element = document.getElementById('invoicePreview');
  
  element.classList.add('generating-pdf');

  const opt = {
    margin:       10,
    filename:     `${invoiceData.docNumber || 'Rechnung'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
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