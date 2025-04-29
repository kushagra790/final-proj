import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import 'jspdf-autotable';

interface HealthCardData {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    bloodType: string;
    email: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
    gender: string;
    age: number;
  };
  medicalConditions: {
    allergies: string[];
    chronicConditions: string[];
    medications: string[];
    surgeries: string[];
  };
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    height: number;
    weight: number;
    temperature: number;
    respiratoryRate: number;
  };
  vaccinations: {
    name: string;
    date: string;
    provider: string;
    type: string;
    notes?: string;
  }[];
  updatedAt: string;
  healthGoals?: string[];
  lifestyleInfo?: {
    diet: string;
    activityLevel: string;
    sleepAverage: number;
    stressLevel: string;
  };
  insights?: {
    healthScore: number;
    recommendations: string[];
    predictions: {
      title: string;
      prediction: string;
      timeframe: string;
    }[];
  };
}

// Function to generate PDF from health card data
export async function generatePDF(data: HealthCardData): Promise<void> {
  try {
    // Create a new PDF document
    const doc = new jsPDF() as any; // Using any for jsPDF-autotable integration
    
    // Add title and header
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 153);
    doc.text('Digital Health Card', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, 105, 28, { align: 'center' });
    
    // Calculate BMI if height and weight are available
    let bmi: string | null = null;
    let bmiCategory: string = "";
    if (data.vitalSigns.height && data.vitalSigns.weight) {
      const heightInMeters = data.vitalSigns.height / 100;
      const bmiValue = data.vitalSigns.weight / (heightInMeters * heightInMeters);
      bmi = bmiValue.toFixed(1);
      
      if (bmiValue < 18.5) bmiCategory = "Underweight";
      else if (bmiValue < 25) bmiCategory = "Normal weight";
      else if (bmiValue < 30) bmiCategory = "Overweight";
      else bmiCategory = "Obesity";
    }
    
    // Add health score if available
    if (data.insights?.healthScore) {
      doc.setFontSize(16);
      doc.setTextColor(0, 102, 204);
      doc.text('Health Score', 20, 40);
      
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text(`${data.insights.healthScore}`, 55, 40);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('/100', 70, 40);
      
      let scoreCategory = "";
      if (data.insights.healthScore >= 80) scoreCategory = "Excellent";
      else if (data.insights.healthScore >= 70) scoreCategory = "Good";
      else if (data.insights.healthScore >= 60) scoreCategory = "Fair";
      else scoreCategory = "Needs Improvement";
      
      doc.text(`(${scoreCategory})`, 85, 40);
      
      // Add a horizontal line
      doc.setDrawColor(220, 220, 220);
      doc.line(20, 45, 190, 45);
    }
    
    // Start y position depends on whether health score was added
    let y = data.insights?.healthScore ? 55 : 40;
    
    // Personal Information section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Personal Information', 20, y);
    y += 8;
    
    // Use autoTable for personal information
    const personalInfoData = [
      ['Full Name', data.personalInfo.fullName],
      ['Date of Birth', formatDate(data.personalInfo.dateOfBirth)],
      ['Age', `${data.personalInfo.age} years`],
      ['Gender', data.personalInfo.gender],
      ['Blood Type', data.personalInfo.bloodType],
      ['Email', data.personalInfo.email],
      ['Phone', data.personalInfo.phone],
      ['Emergency Contact', `${data.personalInfo.emergencyContact} ${data.personalInfo.emergencyPhone ? `- ${data.personalInfo.emergencyPhone}` : ''}`],
    ];
    
    doc.autoTable({
      startY: y,
      head: [],
      body: personalInfoData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 20 },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
    
    // Medical Conditions section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Medical Conditions', 20, y);
    y += 8;
    
    const medicalConditionsData = [
      ['Allergies', data.medicalConditions.allergies.join(', ') || 'None reported'],
      ['Chronic Conditions', data.medicalConditions.chronicConditions.join(', ') || 'None reported'],
      ['Current Medications', data.medicalConditions.medications.join(', ') || 'None reported'],
      ['Past Surgeries', data.medicalConditions.surgeries.join(', ') || 'None reported'],
    ];
    
    // Add health goals if available
    if (data.healthGoals && data.healthGoals.length > 0) {
      medicalConditionsData.push(['Health Goals', data.healthGoals.join(', ')]);
    }
    
    // Add lifestyle info if available
    if (data.lifestyleInfo) {
      const lifestyleText = [
        `Diet: ${data.lifestyleInfo.diet}`,
        `Activity Level: ${data.lifestyleInfo.activityLevel}`,
        `Sleep: ${data.lifestyleInfo.sleepAverage} hours avg.`,
        `Stress Level: ${data.lifestyleInfo.stressLevel}`,
      ].join(', ');
      
      medicalConditionsData.push(['Lifestyle', lifestyleText]);
    }
    
    doc.autoTable({
      startY: y,
      head: [],
      body: medicalConditionsData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 20 },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we need a new page
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    
    // Vital Signs section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Vital Signs', 20, y);
    y += 8;
    
    const vitalSignsData = [
      ['Blood Pressure', data.vitalSigns.bloodPressure || 'Not recorded'],
      ['Heart Rate', data.vitalSigns.heartRate ? `${data.vitalSigns.heartRate} bpm` : 'Not recorded'],
      ['Height', data.vitalSigns.height ? `${data.vitalSigns.height} cm` : 'Not recorded'],
      ['Weight', data.vitalSigns.weight ? `${data.vitalSigns.weight} kg` : 'Not recorded'],
    ];
    
    if (bmi) {
      vitalSignsData.push(['BMI', `${bmi} (${bmiCategory})`]);
    }
    
    if (data.vitalSigns.temperature) {
      vitalSignsData.push(['Temperature', `${data.vitalSigns.temperature} °C`]);
    }
    
    if (data.vitalSigns.respiratoryRate) {
      vitalSignsData.push(['Respiratory Rate', `${data.vitalSigns.respiratoryRate} breaths/min`]);
    }
    
    doc.autoTable({
      startY: y,
      head: [],
      body: vitalSignsData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 20 },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we need a new page
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    
    // Vaccination History section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Vaccination History', 20, y);
    y += 8;
    
    if (data.vaccinations.length === 0) {
      doc.setFontSize(10);
      doc.text('No vaccination records found.', 20, y);
      y += 10;
    } else {
      const vaccinationHeaders = [['Vaccine', 'Date', 'Provider', 'Type', 'Notes']];
      const vaccinationData = data.vaccinations.map(v => [
        v.name,
        formatDate(v.date),
        v.provider,
        v.type,
        v.notes || ''
      ]);
      
      doc.autoTable({
        startY: y,
        head: vaccinationHeaders,
        body: vaccinationData,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 102, 204] },
        margin: { left: 20, right: 20 },
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Add health insights if available
    if (data.insights && (data.insights.recommendations.length > 0 || data.insights.predictions.length > 0)) {
      // Check if we need a new page
      if (y > 200) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Health Insights (AI-Generated)', 20, y);
      y += 8;
      
      // Add recommendations
      if (data.insights.recommendations.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Recommendations:', 20, y);
        y += 6;
        
        doc.setFontSize(9);
        data.insights.recommendations.forEach((rec, index) => {
          doc.text(`${index + 1}. ${rec}`, 25, y);
          y += 5;
        });
        
        y += 5;
      }
      
      // Add predictions
      if (data.insights.predictions.length > 0) {
        // Check if we need a new page
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Health Predictions:', 20, y);
        y += 8;
        
        const predictionHeaders = [['Area', 'Prediction', 'Timeframe']];
        const predictionData = data.insights.predictions.map(p => [
          p.title,
          p.prediction,
          p.timeframe
        ]);
        
        doc.autoTable({
          startY: y,
          head: predictionHeaders,
          body: predictionData,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [0, 102, 204] },
          margin: { left: 20, right: 20 },
        });
        
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Last updated: ${formatDate(data.updatedAt)} - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('This document is for informational purposes only and does not replace medical records.', 105, 295, { align: 'center' });
    }
    
    // Save the PDF
    doc.save(`health_card_${data.personalInfo.fullName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
}

// Function to share health card data
export async function shareHealthCard(data: HealthCardData): Promise<void> {
  try {
    // Generate PDF first (simplified version for sharing)
    const doc = new jsPDF() as any;
    
    // Add title and header
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 153);
    doc.text('Digital Health Card', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${data.personalInfo.fullName}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Last updated: ${formatDate(data.updatedAt)}`, 105, 38, { align: 'center' });
    
    // Add a summary of important information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Health Information', 105, 50, { align: 'center' });
    
    // Basic info table
    const summaryData = [
      ['Blood Type', data.personalInfo.bloodType],
      ['Age', `${data.personalInfo.age} years`],
      ['Emergency Contact', `${data.personalInfo.emergencyContact} ${data.personalInfo.emergencyPhone ? `- ${data.personalInfo.emergencyPhone}` : ''}`],
      ['Allergies', data.medicalConditions.allergies.join(', ') || 'None reported'],
      ['Medications', data.medicalConditions.medications.join(', ') || 'None reported'],
      ['Chronic Conditions', data.medicalConditions.chronicConditions.join(', ') || 'None reported'],
    ];
    
    doc.autoTable({
      startY: 55,
      head: [],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 20 },
    });
    
    // Add a footer note
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('For full health card details, please download the complete version.', 105, 280, { align: 'center' });
    doc.text('This document is for informational purposes only and does not replace medical records.', 105, 285, { align: 'center' });
    
    // Create a blob from the PDF document
    const pdfBlob = doc.output('blob');
    const file = new File(
      [pdfBlob], 
      `health_card_${data.personalInfo.fullName.replace(/\s+/g, '_').toLowerCase()}.pdf`, 
      { type: 'application/pdf' }
    );
    
    // Check if Web Share API is available and can share files
    if (navigator.share && 
        typeof navigator.canShare === 'function' && 
        navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'My Digital Health Card',
          text: 'Here is my digital health card information',
          files: [file]
        });
        return;
      } catch (error) {
        console.log('Error sharing via Web Share API:', error);
        // Fall back to download if sharing fails
      }
    } else {
      console.log('Web Share API not supported or cannot share files, falling back to download');
    }
    
    // Fall back to download method
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health_card_${data.personalInfo.fullName.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    document.body.appendChild(link); // Append to body for Firefox support
    link.click();
    setTimeout(() => {
      document.body.removeChild(link); // Clean up
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error sharing health card:", error);
    throw new Error("Failed to share health card. Please try again.");
  }
}

// Helper function to format dates
function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMMM d, yyyy');
  } catch (e) {
    return "Unknown date";
  }
}
