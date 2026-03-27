import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export const generateParkingTicket = async (entryData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 160] // Slightly longer for v2 info
  });

  const qrData = JSON.stringify({
    id: entryData.id,
    plate: entryData.plate,
    ticket: entryData.ticketNumber
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrData);

  const createCopy = (type, pageIndex) => {
    if (pageIndex > 0) doc.addPage([80, 160]);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RYER PARKING', 40, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`TICKET: ${entryData.ticketNumber}`, 40, 22, { align: 'center' });
    
    doc.addImage(qrCodeDataUrl, 'PNG', 20, 25, 40, 40);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`ESTADO: ${entryData.status || 'ACTIVO'}`, 40, 70, { align: 'center' });
    doc.text(`PLACA: ${entryData.plate}`, 40, 75, { align: 'center' });
    doc.text(`VEHÍCULO: ${entryData.brand} ${entryData.model}`, 40, 80, { align: 'center' });
    doc.text(`IN: ${new Date(entryData.entryTime).toLocaleString()}`, 40, 85, { align: 'center' });
    doc.text(`SERVICIO: ${entryData.serviceType}`, 40, 90, { align: 'center' });
    
    if (entryData.nextPaymentDate) {
      doc.setFont('helvetica', 'bold');
      doc.text(`PRÓX. PAGO: ${new Date(entryData.nextPaymentDate).toLocaleDateString()}`, 40, 100, { align: 'center' });
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PAGADO: $${entryData.total}`, 40, 110, { align: 'center' });
    
    doc.setLineDash([1, 1], 0);
    doc.line(10, 120, 70, 120);
    
    doc.setFontSize(10);
    doc.text(type, 40, 130, { align: 'center' });
    
    doc.setFontSize(7);
    doc.text('ESTE TICKET DEBE PERMANECER EN EL VEHÍCULO', 40, 140, { align: 'center' });
    doc.text('GRACIAS POR SU PREFERENCIA', 40, 145, { align: 'center' });
  };

  createCopy('COPIA CLIENTE', 0);
  createCopy('COPIA NEGOCIO', 1);
  createCopy('CONTROL INTERNO', 2);

  return doc;
};
