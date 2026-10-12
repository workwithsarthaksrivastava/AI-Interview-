import { jsPDF } from 'jspdf';
import { EvaluationReport } from '../types';

export function downloadEvaluationReportPdf(report: EvaluationReport) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Color Palette
  const colors = {
    primary: [20, 83, 45],       // Deep Sage Green
    accent: [16, 185, 129],      // Mint
    textDark: [15, 23, 42],      // Slate 900
    textMuted: [100, 116, 139],  // Slate 500
    border: [226, 232, 240],     // Slate 200
    cardBg: [248, 250, 252],     // Slate 50
    passGreen: [22, 163, 74],    // Emerald 600
    warningAmber: [217, 119, 6], // Amber 600
    failRed: [220, 38, 38]       // Red 600
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 30) {
      doc.addPage();
      y = margin;
      drawFooter();
    }
  };

  const drawFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(
        `Shakchhatkar AI Interview Platform · Confidential Candidate Evaluation`,
        margin,
        pageHeight - 20
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 20,
        { align: 'right' }
      );
    }
  };

  // -------------------------------------------------------------
  // HEADER
  // -------------------------------------------------------------
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y, contentWidth, 54, 6, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Shakchhatkar', margin + 16, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text('Official AI Bar-Raiser Performance & Hire-Readiness Evaluation', margin + 16, y + 42);

  doc.setFontSize(8);
  doc.text(`Report ID: ${report.id.slice(0, 18)}`, pageWidth - margin - 16, y + 32, { align: 'right' });

  y += 70;

  // -------------------------------------------------------------
  // CANDIDATE & INTERVIEW META GRID
  // -------------------------------------------------------------
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 4, 4, 'FD');

  const colWidth = contentWidth / 4;
  const metaItems = [
    { label: 'CANDIDATE', value: report.candidateName },
    { label: 'TARGET COMPANY', value: report.companyName },
    { label: 'ROLE & LEVEL', value: `${report.roleTitle} (${report.difficulty})` },
    { label: 'EVALUATION DATE', value: `${report.date || new Date().toISOString().split('T')[0]}` }
  ];

  metaItems.forEach((item, index) => {
    const colX = margin + index * colWidth + 12;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(item.label, colX, y + 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    const cleanVal = doc.splitTextToSize(item.value, colWidth - 16)[0] || item.value;
    doc.text(cleanVal, colX, y + 34);
  });

  y += 62;

  // -------------------------------------------------------------
  // VERDICT & SCORE CARD
  // -------------------------------------------------------------
  const verdict = report.hireReadinessVerdict || 'Borderline / Follow-up Needed';
  const isStrong = verdict.toLowerCase().includes('strong hire');
  const isLean = verdict.toLowerCase().includes('lean hire');
  const isDoNotHire = verdict.toLowerCase().includes('do not hire');

  let verdictBgColor = colors.warningAmber;
  if (isStrong) verdictBgColor = colors.passGreen;
  else if (isDoNotHire) verdictBgColor = colors.failRed;

  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, y, contentWidth, 75, 4, 4, 'FD');

  // Left: Score badge
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin + 12, y + 10, 80, 55, 4, 4, 'F');

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${Math.round(report.overallScore)}`, margin + 52, y + 38, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('SCORE / 100', margin + 52, y + 54, { align: 'center' });

  // Center: Verdict & Grade Band
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(verdictBgColor[0], verdictBgColor[1], verdictBgColor[2]);
  doc.text(`VERDICT: ${verdict.toUpperCase()}`, margin + 106, y + 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  doc.text(`Grade Band: ${report.gradeBand || 'Evaluated'} · Interview Duration: ${report.durationMinutes || 25} minutes`, margin + 106, y + 46);

  doc.setFontSize(8);
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(`Evaluated strictly against ${report.companyName}'s canonical ${report.difficulty} engineering bar`, margin + 106, y + 58);

  y += 90;

  // -------------------------------------------------------------
  // EXECUTIVE SUMMARY
  // -------------------------------------------------------------
  checkPageBreak(80);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Executive Bar-Raiser Summary', margin, y);
  y += 14;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  const execSummaryLines = doc.splitTextToSize(report.executiveSummary || 'No summary provided.', contentWidth);
  doc.text(execSummaryLines, margin, y);
  y += execSummaryLines.length * 12 + 16;

  // -------------------------------------------------------------
  // CORE COMPETENCY SCORES
  // -------------------------------------------------------------
  if (report.categoryScores && report.categoryScores.length > 0) {
    checkPageBreak(120);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Core Competency Ratings', margin, y);
    y += 14;

    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text('COMPETENCY', margin + 8, y + 12);
    doc.text('SCORE', margin + 160, y + 12);
    doc.text('BENCHMARK', margin + 220, y + 12);
    doc.text('EVIDENCE & JUSTIFICATION', margin + 300, y + 12);
    y += 20;

    report.categoryScores.forEach((cat) => {
      checkPageBreak(30);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text(cat.category, margin + 8, y + 10);

      const scoreColor = cat.score >= (cat.benchmark || 70) ? colors.passGreen : colors.failRed;
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`${Math.round(cat.score)}%`, margin + 160, y + 10);

      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(`${Math.round(cat.benchmark || 70)}%`, margin + 220, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      const justLines = doc.splitTextToSize(cat.justification || '-', contentWidth - 308);
      doc.text(justLines, margin + 300, y + 10);

      y += Math.max(16, justLines.length * 11 + 4);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.line(margin, y - 2, margin + contentWidth, y - 2);
    });

    y += 16;
  }

  // -------------------------------------------------------------
  // QUESTION-BY-QUESTION BREAKDOWN
  // -------------------------------------------------------------
  if (report.questionsBreakdown && report.questionsBreakdown.length > 0) {
    checkPageBreak(100);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Strict Question-by-Question Evaluation', margin, y);
    y += 14;

    report.questionsBreakdown.forEach((q, idx) => {
      checkPageBreak(90);
      doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(`Q${idx + 1}: ${q.category || 'Technical Question'}`, margin + 8, y + 15);

      const qScore = q.scoreOutOf10 || 5;
      const qScoreColor = qScore >= 7 ? colors.passGreen : qScore >= 5 ? colors.warningAmber : colors.failRed;
      doc.setTextColor(qScoreColor[0], qScoreColor[1], qScoreColor[2]);
      doc.text(`Score: ${qScore} / 10`, pageWidth - margin - 12, y + 15, { align: 'right' });
      y += 28;

      // Question text
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      const qTextLines = doc.splitTextToSize(`"${q.questionText}"`, contentWidth);
      doc.text(qTextLines, margin, y);
      y += qTextLines.length * 11 + 6;

      // Candidate answer excerpt
      if (q.candidateAnswerExcerpt) {
        checkPageBreak(30);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        const ansLines = doc.splitTextToSize(`Candidate Response: "${q.candidateAnswerExcerpt}"`, contentWidth);
        doc.text(ansLines, margin, y);
        y += ansLines.length * 10 + 6;
      }

      // Strengths & Gaps
      checkPageBreak(40);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.passGreen[0], colors.passGreen[1], colors.passGreen[2]);
      doc.text('Strengths: ', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      const goodLines = doc.splitTextToSize(q.whatWasGood || 'Direct response structure.', contentWidth - 60);
      doc.text(goodLines, margin + 55, y);
      y += goodLines.length * 10 + 4;

      checkPageBreak(40);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.failRed[0], colors.failRed[1], colors.failRed[2]);
      doc.text('Omissions: ', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      const missLines = doc.splitTextToSize(q.whatWasMissing || 'None noted.', contentWidth - 60);
      doc.text(missLines, margin + 55, y);
      y += missLines.length * 10 + 4;

      if (q.idealModelAnswer) {
        checkPageBreak(35);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text('Ideal Bar-Raiser Answer: ', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        const idealLines = doc.splitTextToSize(q.idealModelAnswer, contentWidth - 110);
        doc.text(idealLines, margin + 105, y);
        y += idealLines.length * 9 + 8;
      }

      y += 6;
    });

    y += 10;
  }

  // -------------------------------------------------------------
  // SPEECH & DELIVERY ANALYTICS
  // -------------------------------------------------------------
  if (report.speechAnalytics) {
    checkPageBreak(90);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Speech & Delivery Analytics', margin, y);
    y += 14;

    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(margin, y, contentWidth, 38, 4, 4, 'FD');

    const sa = report.speechAnalytics;
    const metrics = [
      { label: 'TALKING PACE', val: `${sa.overallWpm || 135} WPM (${sa.paceConsistency || 'Good'})` },
      { label: 'FILLER WORDS', val: `${sa.fillerWordsCount || 0} total` },
      { label: 'TALK-TO-LISTEN', val: `${sa.talkToListenRatioPercent || 60}%` },
      { label: 'CLARITY RATING', val: `${sa.clarityScore || 85} / 100` }
    ];

    metrics.forEach((m, i) => {
      const colX = margin + i * colWidth + 10;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(m.label, colX, y + 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text(m.val, colX, y + 28);
    });

    y += 50;
  }

  // -------------------------------------------------------------
  // TOP STRENGTHS & WEAKNESSES
  // -------------------------------------------------------------
  checkPageBreak(120);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Key Strengths & Critical Areas for Growth', margin, y);
  y += 14;

  const halfWidth = (contentWidth - 16) / 2;
  const strengths = (report.topStrengths || []).map((s: any) => {
    if (!s) return '';
    if (typeof s === 'string') return s;
    const title = s.title || '';
    const detail = s.impact || s.evidenceQuote || '';
    return title ? (detail ? `${title}: ${detail}` : title) : detail;
  }).filter(Boolean);
  if (strengths.length === 0) strengths.push('Structured communication and clear thought organization.');

  const weaknesses = (report.topWeaknesses || []).map((w: any) => {
    if (!w) return '';
    if (typeof w === 'string') return w;
    const title = w.title || '';
    const detail = w.remediation || w.evidenceQuote || '';
    return title ? (detail ? `${title}: ${detail}` : title) : detail;
  }).filter(Boolean);
  if (weaknesses.length === 0) weaknesses.push('Provide deeper quantitative metrics and explicit failure-mode considerations.');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.passGreen[0], colors.passGreen[1], colors.passGreen[2]);
  doc.text('VERIFIED STRENGTHS:', margin, y);

  doc.setTextColor(colors.failRed[0], colors.failRed[1], colors.failRed[2]);
  doc.text('CRITICAL GAPS / WEAKNESSES:', margin + halfWidth + 16, y);
  y += 12;

  const maxItems = Math.min(Math.max(strengths.length, weaknesses.length), 5);
  for (let i = 0; i < maxItems; i++) {
    checkPageBreak(35);
    const startY = y;
    let sLinesLen = 0;
    let wLinesLen = 0;

    if (strengths[i]) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      const sLines = doc.splitTextToSize(`• ${strengths[i]}`, halfWidth);
      doc.text(sLines, margin, startY);
      sLinesLen = sLines.length;
    }
    if (weaknesses[i]) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      const wLines = doc.splitTextToSize(`• ${weaknesses[i]}`, halfWidth);
      doc.text(wLines, margin + halfWidth + 16, startY);
      wLinesLen = wLines.length;
    }
    const maxLineCount = Math.max(sLinesLen, wLinesLen, 1);
    y += maxLineCount * 11 + 4;
  }

  // Red Flags Section if present
  if (report.redFlags && report.redFlags.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.failRed[0], colors.failRed[1], colors.failRed[2]);
    doc.text('HIRING BAR RED FLAGS IDENTIFIED:', margin, y);
    y += 12;

    report.redFlags.forEach((rf: any) => {
      checkPageBreak(25);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.failRed[0], colors.failRed[1], colors.failRed[2]);
      const flagText = typeof rf === 'string' ? rf : `[${rf.severity || 'High'} Severity] ${rf.flag}: "${rf.excerpt || ''}"`;
      const flagLines = doc.splitTextToSize(`⚠ ${flagText}`, contentWidth);
      doc.text(flagLines, margin, y);
      y += flagLines.length * 10 + 4;
    });
    y += 8;
  }

  // -------------------------------------------------------------
  // 7-DAY IMPROVEMENT ROADMAP
  // -------------------------------------------------------------
  const schedule = report.personalizedImprovementPlan?.sevenDaySchedule;
  if (schedule && schedule.length > 0) {
    checkPageBreak(80);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Targeted 7-Day Action Plan', margin, y);
    y += 14;

    schedule.forEach((item) => {
      checkPageBreak(20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text(`${item.day}:`, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.text(`${item.task} (${item.timeNeeded || '2 hrs'})`, margin + 65, y);
      y += 14;
    });
  }

  // Final footer across all pages
  drawFooter();

  // Save PDF
  const safeName = (report.candidateName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeComp = (report.companyName || 'Interview').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Shakchhatkar_Evaluation_${safeName}_${safeComp}.pdf`;
  doc.save(filename);
}
