import { generateCertificate } from "../../src/certificates/generateCertificate.js";
import { jsPDF } from "jspdf";

// jsPDF defines save() on instances (not the prototype) via its plugin API.
// Patch jsPDF.API.save to no-op so tests don't write PDFs to disk.
jsPDF.API.save = function () { return this; };
const runs = [
  ["contexts-only (v6.6 shape)",  { questTitles:["Q1","Q2"], contexts:["solo","with_family"], evidenceCount:5 }],
  ["questDates (v6.7 parent)",    { questTitles:["Q1","Q2"], questDates:["2025-01-01","2025-01-02"], contexts:[], evidenceCount:5 }],
  ["no right column (v6.7 quest)",{ questTitles:["Q1"], contexts:[], evidenceCount:1 }],
  ["empty evidence",              {}],
  ["both populated",              { questTitles:["Q1"], questDates:["2025-01-01"], contexts:["solo"], evidenceCount:3 }],
];
for(const [name,ev] of runs){
  try{
    generateCertificate({ childName:"Test", subCompetencyKey:"communicating", profileLevel:3, profileText:"x", evidenceSummary:ev, dateEarned:"2025-01-01", avatarName:"Buddy" });
    console.log("✓", name);
  }catch(e){
    console.log("✗", name, e.message);
  }
}
