import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";

export const carriers = [
  {
    id: "aetna",
    name: "Aetna",
    logo: aetnaLogo,
    contacts: [
      { type: "Jonathan Lemaster - Broker Manager", subtitle: "Greater Lexington / Ashland / Eastern Kentucky", number: "(859) 333-5389", email: "lemasterj1@aetna.com" },
      { type: "Will Coursey - Broker Manager", subtitle: "Greater Bowling Green, Owensboro, Western KY", number: "(270) 816-9531", email: "courseyw@aetna.com" },
      { type: "Nina Grinestaff - Broker Manager", subtitle: "Greater Louisville, Northern KY", number: "(502) 443-5381", email: "grinestaff@aetna.com" },
      { type: "Broker Services", number: "(866) 714-9301", email: "brokersupport@aetna.com" },
    ],
    links: [
      { name: "Broker Portal", url: "https://www.aetna.com/producer_public/login.fcc" },
      { name: "Kit Ordering Portal", url: "https://aetna-pek-ff-op.memberdoc.com/#/login", subtext: "Username and password are your NPN" },
      { name: "Kentucky Broker Managers", url: "/downloads/Aetna_KY_Medicare_Broker_Managers.pdf" },
    ],
    downloads: [
      { name: "Aetna Medicare 2026 KY Market Specific Training", url: "/downloads/Aetna_Medicare_2026_KY_Market_Specific_Training.pdf" },
      { name: "Aetna Medicare Extra Benefits Card 2026 Broker Playbook", url: "/downloads/2026_Aetna_Medicare_EBC_Broker_Playbook.pdf" },
    ],
    summaryOfBenefits: {
      "Kentucky": {
        "HMO": [
          { 
            planName: "Aetna Medicare Signature Extra (HMO-POS) H0628 - 007", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H0628-007", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Signature_Extra_HMO-POS_H0628-007.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Signature_Extra_HMO-POS_H0628-007_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Signature_Extra_HMO-POS_H0628-007_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Formulary_2026.pdf" },
            ]
          },
          { 
            planName: "Aetna Medicare Signature (HMO-POS) H0628 - 010", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H0628-010", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-010_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-010_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-010_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-010_Formulary_2026.pdf" },
            ]
          },
          { 
            planName: "Aetna Medicare Signature (HMO-POS) H0628 - 008", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H0628-008", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-008_2026_SOB.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-008_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-008_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-008_Formulary_2026.pdf" },
            ]
          },
          { 
            planName: "Aetna Medicare Signature (HMO-POS) H0628 - 024", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H0628-024", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-024_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-024_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-024_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Signature_HMO-POS_H0628-024_Formulary_2026.pdf" },
            ]
          },
        ],
        "PPO": [
          { 
            planName: "Aetna Medicare Signature (PPO) H5521 - 260", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H5521-260", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-260_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-260_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-260_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-260_Formulary_2026.pdf" },
            ]
          },
          { 
            planName: "Aetna Medicare Signature (PPO) H5521 - 156", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H5521-156", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-156_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-156_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-156_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-156_Formulary_2026.pdf" },
            ]
          },
          { 
            planName: "Aetna Medicare Signature (PPO) H5521 - 085", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H5521-085", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-085_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-085_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-085_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Signature_PPO_H5521-085_Formulary_2026.pdf" },
            ]
          },
          { 
            planName: "Aetna Medicare Eagle Giveback (PPO) H5521 - 488", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H5521-488", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Eagle_Giveback_PPO_H5521-488_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Eagle_Giveback_PPO_H5521-488_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Eagle_Giveback_PPO_H5521-488_EOC_2026.pdf" },
            ]
          },
          { 
            planName: "Aetna Medicare Value Plus (PPO) H5521 - 490", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H5521-490", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Value_Plus_PPO_H5521-490_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_Value_Plus_PPO_H5521-490_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Value_Plus_PPO_H5521-490_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Value_Plus_PPO_H5521-490_Formulary_2026.pdf" },
            ]
          },
        ],
        "D-SNP": [
          { 
            planName: "Aetna Medicare HIDE (HMO D-SNP) H0628 - 012", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H0628-012", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_HIDE_HMO_DSNP_H0628-012_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Aetna_Medicare_HIDE_HMO_DSNP_H0628-012_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_HIDE_HMO_DSNP_H0628-012_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_HIDE_HMO_DSNP_H0628-012_Formulary_2026.pdf" },
            ]
          },
          { 
            planName: "Aetna Medicare Partial Dual (HMO D-SNP) H0628 - 040", 
            documents: [
              { type: "Plan Web Page", url: "http://www.aetnamedicare.com/H0628-040", isExternal: true },
              { type: "SOB", url: "/downloads/Aetna_Medicare_Partial_Dual_HMO_DSNP_H0628-040_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Aetna_Medicare_Partial_Dual_HMO_DSNP_H0628-040_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Aetna_Medicare_Partial_Dual_HMO_DSNP_H0628-040_Formulary_2026.pdf" },
            ]
          },
        ],
      },
      "Tennessee": {
        "HMO": [],
        "PPO": [],
        "D-SNP": [],
      },
      "Ohio": {
        "HMO": [],
        "PPO": [],
        "D-SNP": [],
      },
      "Indiana": {
        "HMO": [],
        "PPO": [],
        "D-SNP": [],
      },
      "West Virginia": {
        "HMO": [],
        "PPO": [],
        "D-SNP": [],
      },
      "Georgia": {
        "HMO": [],
        "PPO": [],
        "D-SNP": [],
      },
      "Virginia": {
        "HMO": [],
        "PPO": [],
        "D-SNP": [],
      },
    },
  },
  {
    id: "anthem",
    name: "Anthem",
    logo: anthemLogo,
    contacts: [
      { type: "Sam Call", subtitle: "Western KY", email: "sam.call@anthem.com", number: "(502) 216-3480" },
      { type: "Jordan Gentry", subtitle: "Eastern KY", email: "jordan.gentry@anthem.com", number: "(859) 585-8183" },
      { type: "Todd Jarboe", subtitle: "Agency Services Rep", email: "todd.jarboe@anthem.com", number: "(502) 396-0695" },
      { type: "Broker Services", number: "(800) 633-4368", email: "medicareagentsupport@anthem.com" },
    ],
    links: [
      { name: "Producer World", url: "https://brokerportal.anthem.com/apps/ptb/login" },
      { name: "mProducer", url: "https://mproducer.anthem.com/mproducer/public/login" },
      { name: "Order Materials", url: "https://custompoint.rrd.com/xs2/prelogin?qwerty=25113007" },
      { name: "Certification", url: "https://getcertified.elevancehealth.com/medicare/certify?brand=ELV" },
    ],
    downloads: [
      { name: "Non-Commissionable Plans", url: "/downloads/Anthem_Non-Commissionable-MA-Plans_ABCBS.pdf" },
    ],
    summaryOfBenefits: {
      "Kentucky": {
        "HMO": [
          {
            planName: "Anthem Medicare Advantage (HMO-POS) H9525-013-001",
            nonCommissionable: true,
            documents: [
              { type: "SOB", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-001_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-001_EOC_2026.pdf" },
              { type: "Enrollment Application", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-001_Application_2026.pdf" },
            ]
          },
          {
            planName: "Anthem Medicare Advantage (HMO-POS) H9525-013-005",
            documents: [
              { type: "SOB", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-005_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-005_EOC_2026.pdf" },
              { type: "Enrollment Application", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-005_Application_2026.pdf" },
            ]
          },
          {
            planName: "Anthem Medicare Advantage (HMO-POS) H9525-013-003",
            documents: [
              { type: "SOB", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-003_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-003_EOC_2026.pdf" },
              { type: "Enrollment Application", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-003_Application_2026.pdf" },
            ]
          },
          {
            planName: "Anthem Medicare Advantage (HMO-POS) H9525-013-002",
            documents: [
              { type: "SOB", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-002_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-002_EOC_2026.pdf" },
              { type: "Enrollment Application", url: "/downloads/Anthem_Medicare_Advantage_HMO-POS_H9525-013-002_Application_2026.pdf" },
            ]
          },
          {
            planName: "Anthem Kidney Care (HMO-POS C-SNP) H9525-011-000",
            nonCommissionable: true,
            documents: [
              { type: "SOB", url: "/downloads/Anthem_Kidney_Care_HMO-POS_C-SNP_H9525-011-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Anthem_Kidney_Care_HMO-POS_C-SNP_H9525-011-000_EOC_2026.pdf" },
              { type: "Enrollment Application", url: "/downloads/Anthem_Kidney_Care_HMO-POS_C-SNP_H9525-011-000_Application_2026.pdf" },
            ]
          },
        ],
      },
      "Tennessee": {
        "HMO": [],
      },
      "Ohio": {
        "HMO": [],
      },
      "Indiana": {
        "HMO": [],
      },
      "West Virginia": {
        "HMO": [],
      },
      "Georgia": {
        "HMO": [],
      },
      "Virginia": {
        "HMO": [],
      },
    },
  },
  {
    id: "devoted",
    name: "Devoted",
    logo: devotedLogo,
    contacts: [
      { type: "Jotham Cortez - Sales Director", subtitle: "MO, AR, KY, KS", number: "(573) 356-4005", email: "jotham.cortez@devoted.com" },
      { type: "Cole Lawson - Broker Manager", subtitle: "Kentucky", number: "(618) 946-1111", email: "cole.lawson@devoted.com" },
      { type: "Hailey Lindenbauer - Broker Manager", subtitle: "KY (Eastern, Lexington, Southeastern)", number: "(502) 794-1717", email: "hailey.lindenbauer@devoted.com" },
      { type: "Agent Support Team", number: "1-877-764-9446" },
    ],
    links: [
      { name: "Agent Portal", url: "https://agent.devoted.com/" },
      { name: "Search Drugs", url: "https://www.devoted.com/search-formulary/" },
      { name: "Search Providers", url: "https://www.devoted.com/search-providers/" },
    ],
    downloads: [
      { name: "Broker Manual", url: "/downloads/Devoted_Health_Broker_Manual.pdf" },
      { name: "Formulary", url: "/downloads/Devoted_Drug_List_2026.pdf" },
    ],
    summaryOfBenefits: {
      "Kentucky": {
        "C-SNP": [
          {
            planName: "DEVOTED C-SNP CHOICE PLUS 004 KY (PPO C-SNP)",
            documents: [
              { type: "SOB", url: "/downloads/Devoted_C-SNP_Choice_Plus_004_KY_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Devoted_C-SNP_Choice_Plus_004_KY_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Devoted_Drug_List_2026.pdf" },
            ],
          },
          {
            planName: "DEVOTED C-SNP CHOICE PREMIUM 006 KY (PPO C-SNP)",
            documents: [
              { type: "SOB", url: "/downloads/Devoted_C-SNP_Choice_Premium_006_KY_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Devoted_C-SNP_Choice_Premium_006_KY_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Devoted_Drug_List_2026.pdf" },
            ],
          },
        ],
        "PPO": [
          {
            planName: "DEVOTED CHOICE 001 KY (PPO)",
            documents: [
              { type: "SOB", url: "/downloads/Devoted_Choice_001_KY_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Devoted_Choice_001_KY_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Devoted_Choice_001_KY_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Devoted_Drug_List_2026.pdf" },
            ],
          },
        ],
        "Giveback": [
          {
            planName: "DEVOTED CHOICE GIVEBACK 002 KY (PPO)",
            documents: [
              { type: "SOB", url: "/downloads/Devoted_Choice_Giveback_002_KY_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Devoted_Choice_Giveback_002_KY_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Devoted_Choice_Giveback_002_KY_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Devoted_Drug_List_2026.pdf" },
            ],
          },
        ],
      },
      "Tennessee": {
        "C-SNP": [],
        "PPO": [],
        "Giveback": [],
      },
      "Ohio": {
        "C-SNP": [],
        "PPO": [],
        "Giveback": [],
      },
      "Indiana": {
        "C-SNP": [],
        "PPO": [],
        "Giveback": [],
      },
      "West Virginia": {
        "C-SNP": [],
        "PPO": [],
        "Giveback": [],
      },
      "Georgia": {
        "C-SNP": [],
        "PPO": [],
        "Giveback": [],
      },
      "Virginia": {
        "C-SNP": [],
        "PPO": [],
        "Giveback": [],
      },
    },
  },
  {
    id: "humana",
    name: "Humana",
    logo: humanaLogo,
    contacts: [
      { type: "Horace Williams - Broker Relationship Executive", number: "(502) 313-7938", email: "hwilliams41@humana.com" },
      { type: "Chris Baker - Broker Relationship Manager", subtitle: "Eastern Kentucky", number: "(859) 227-9256", email: "cbaker56@humana.com" },
      { type: "Samantha Stevenson - Broker Relationship Manager", subtitle: "Western Kentucky", number: "(502) 438-3816", email: "sjones224@humana.com" },
      { type: "Humana Agent Support Unit", number: "(800) 309-3163", email: "AgentSupport@Humana.com" },
    ],
    links: [
      { name: "Vantage", url: "https://account.humana.com/" },
      { name: "Medicare Drug List Search", url: "https://rxcalculator.humana.com/medicaredrugsearch" },
      { name: "Find a Provider", url: "https://findcare.humana.com/" },
    ],
    downloads: [
      { name: "KY Humana Market Product Guide 2026", url: "/downloads/KY_Humana_Market_Product_Guide_2026.pdf" },
      { name: "Blank Verification of Chronic Condition (VCC) Form", url: "/downloads/Blank_Verification_of_Chronic_Condition_VCC.pdf" },
      { name: "2026 OTC Catalog and Order Form", url: "/downloads/Humana_2026_OTC_Catalog_Order_Form.pdf" },
    ],
    summaryOfBenefits: {
      "Kentucky": {
        "Humana Community": [
          {
            planName: "Humana Community (HMO) H1036-236-000",
            labels: [
              { text: "Louisville", type: "location" },
              { text: "Smaller Network", type: "caution" },
              { text: "High Dental Allowance", type: "positive" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/Humana_Community_HMO_H1036-236-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Community_HMO_H1036-236-000_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Community_HMO_H1036-236-000_ANOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana Community (HMO) H5178-002-000",
            labels: [
              { text: "Lexington", type: "location" },
              { text: "Smaller Network", type: "caution" },
              { text: "High Dental Allowance", type: "positive" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/Humana_Community_HMO_H5178-002-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Community_HMO_H5178-002-000_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Community_HMO_H5178-002-000_ANOC_2026.pdf" },
            ],
          },
        ],
        "Humana Gold Plus": [
          {
            planName: "Humana Gold Plus (HMO) H5619-071",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_H5619-071_HMO_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Gold_Plus_H5619-071_HMO_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_H5619-071_HMO_EOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana Gold Plus (HMO) H0292-003-000",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_HMO_H0292-003-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_HMO_H0292-003-000_EOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana Gold Plus CKD (HMO C-SNP) H5619-170",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_EOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana Gold Plus SNP-DE (HMO D-SNP) H5619-163 HIDE",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_EOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana Gold Plus SNP-DE (HMO D-SNP) H1036-320 HIDE",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_SNP-DE_H1036-320_HMO_DSNP_HIDE_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_SNP-DE_H1036-320_HMO_DSNP_HIDE_EOC_2026.pdf" },
            ],
          },
        ],
        "Humana Dual Select": [
          {
            planName: "Humana Dual Select (HMO D-SNP) H5619-075 HIDE",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_EOC_2026.pdf" },
            ],
          },
        ],
        "HumanaChoice": [
          {
            planName: "HumanaChoice (PPO) H7617-050-000",
            documents: [
              { type: "SOB", url: "/downloads/HumanaChoice_H7617-050_PPO_H7617-050-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/HumanaChoice_H7617-050_PPO_H7617-050-000_EOC_2026.pdf" },
            ],
          },
          {
            planName: "HumanaChoice Giveback (PPO) H7617-049",
            documents: [
              { type: "SOB", url: "/downloads/HumanaChoice_Giveback_H7617-049_PPO_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/HumanaChoice_Giveback_H7617-049_PPO_EOC_2026.pdf" },
            ],
          },
          {
            planName: "HumanaChoice SNP-DE (PPO D-SNP) H5525-045 HIDE",
            documents: [
              { type: "SOB", url: "/downloads/HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_EOC_2026.pdf" },
            ],
          },
        ],
        "Humana USAA Honor": [
          {
            planName: "Humana USAA Honor Giveback (PPO) H5216-105-000",
            documents: [
              { type: "SOB", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-105-000_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-105-000_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-105-000_EOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana USAA Honor Giveback (PPO) H5216-225-000",
            documents: [
              { type: "SOB", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-225-000_SOB_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-225-000_ANOC_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-225-000_EOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana USAA Honor Giveback (PPO) H7617-005-000",
            documents: [
              { type: "SOB", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H7617-005-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H7617-005-000_EOC_2026.pdf" },
            ],
          },
        ],
      },
      "Tennessee": {
        "Humana Community": [],
        "Humana Gold Plus": [],
        "Humana Dual Select": [],
        "HumanaChoice": [],
        "Humana USAA Honor": [],
      },
      "Ohio": {
        "Humana Community": [],
        "Humana Gold Plus": [],
        "Humana Dual Select": [],
        "HumanaChoice": [],
        "Humana USAA Honor": [],
      },
      "Indiana": {
        "Humana Community": [],
        "Humana Gold Plus": [],
        "Humana Dual Select": [],
        "HumanaChoice": [],
        "Humana USAA Honor": [],
      },
      "West Virginia": {
        "Humana Community": [],
        "Humana Gold Plus": [],
        "Humana Dual Select": [],
        "HumanaChoice": [],
        "Humana USAA Honor": [],
      },
      "Georgia": {
        "Humana Community": [],
        "Humana Gold Plus": [],
        "Humana Dual Select": [],
        "HumanaChoice": [],
        "Humana USAA Honor": [],
      },
      "Virginia": {
        "Humana Community": [],
        "Humana Gold Plus": [],
        "Humana Dual Select": [],
        "HumanaChoice": [],
        "Humana USAA Honor": [],
      },
    },
  },
  {
    id: "uhc",
    name: "United Healthcare",
    logo: uhcLogo,
    contacts: [
      { name: "Joni Sena", role: "Broker Development Director", region: "Kentucky", phone: "(859) 608-2195", email: "Joni_Sena@uhc.com" },
      { name: "Tim Kryzdlowski", role: "Territory Manager", region: "Western Kentucky", phone: "(502) 609-6806", email: "Timothy_Kryzdlowski@uhc.com" },
      { name: "Lydia Poole", role: "Territory Manager", region: "Southern Kentucky", phone: "(615) 390-0878", email: "Lydia_Poole@uhc.com" },
      { name: "Dana Ranck", role: "Territory Manager", region: "Central Kentucky", phone: "(859) 492-8662", email: "Dana_Ranck@uhc.com" },
      { name: "Liz Maynard", role: "Territory Manager", region: "Northern Kentucky", phone: "(513) 827-3035", email: "Elizabeth_Maynard1@uhc.com" },
      { name: "Stephanie Becher", role: "Territory Manager", region: "Eastern Kentucky", phone: "(859) 797-8577", email: "Stephanie_Becher@uhc.com" },
      { type: "UHC Agent Support", number: "(800) 232-7242", email: "uhc_agent_service@uhc.com" },
    ],
    links: [
      { name: "Agent Portal", url: "https://www.uhcagent.com" },
      { name: "Plan Finder", url: "https://www.uhcmedicaresolutions.com/" },
      { name: "Find a Provider", url: "https://connect.werally.com/uhc/home" },
    ],
    downloads: [
      { name: "2026 UCard Quick Reference Guide", url: "/downloads/UHC_2026_UCard_Quick_Reference_Guide.pdf" },
      { name: "2026 Fitness Quick Reference Guide", url: "/downloads/UHC_2026_Fitness_Quick_Reference_Guide.pdf" },
      { name: "2026 OTC + Healthy Food + Utilities Quick Reference Guide", url: "/downloads/UHC_2026_OTC_Healthy_Food_Utilities_Quick_Reference_Guide.pdf" },
      { name: "2026 Dental Quick Reference Guide", url: "/downloads/UHC_2026_Dental_Quick_Reference_Guide.pdf" },
      { name: "2026 SSBCI Quick Reference Guide", url: "/downloads/UHC_2026_SSBCI_Quick_Reference_Guide.pdf" },
      { name: "2026 Part D Formulary Changes", url: "/downloads/UHC_2026_Part_D_Formulary_Changes.pdf" },
    ],
    summaryOfBenefits: {
      "Kentucky": {
        "AARP": [
          {
            planName: "UnitedHealthcare AARP Essentials KY1 (HMO) H5253-099",
            documents: [
              { type: "SOB", url: "/downloads/UHC_AARP_Essentials_KY1_HMO_H5253-099_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_AARP_Essentials_KY1_HMO_H5253-099_EOC_2026.pdf" },
              { type: "Highlights", url: "/downloads/UHC_AARP_Essentials_KY1_HMO_H5253-099_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UnitedHealthcare AARP Patriot (No Rx) KYMA01 (PPO) H8768-020",
            documents: [
              { type: "SOB", url: "/downloads/UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_EOC_2026.pdf" },
              { type: "Highlights", url: "/downloads/UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_Highlights_2026.pdf" },
            ],
          },
        ],
        "Dual Complete": [
          {
            planName: "UnitedHealthcare Dual Complete KYS001 (PPO D-SNP) H1889-008",
            labels: [
              { text: "QMB", type: "eligibility" },
              { text: "QMB+", type: "eligibility" },
              { text: "SLMB", type: "eligibility" },
              { text: "SLMB+", type: "eligibility" },
              { text: "QI", type: "eligibility" },
              { text: "FBDE", type: "eligibility" },
              { text: "QDWI", type: "eligibility" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_EOC_2026.pdf" },
              { type: "Highlights", url: "/downloads/UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UnitedHealthcare Dual Complete KYS002 (D-SNP) H6595-004",
            labels: [
              { text: "QMB", type: "eligibility" },
              { text: "QMB+", type: "eligibility" },
              { text: "SLMB", type: "eligibility" },
              { text: "SLMB+", type: "eligibility" },
              { text: "QI", type: "eligibility" },
              { text: "FBDE", type: "eligibility" },
              { text: "QDWI", type: "eligibility" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYS002_DSNP_H6595-004_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYS002_DSNP_H6595-004_EOC_2026.pdf" },
              { type: "Highlights", url: "/downloads/UHC_Dual_Complete_KYS002_DSNP_H6595-004_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UnitedHealthcare Dual Complete KYS3 (PPO D-SNP) H1889-030",
            labels: [
              { text: "QMB", type: "eligibility" },
              { text: "QMB+", type: "eligibility" },
              { text: "SLMB", type: "eligibility" },
              { text: "SLMB+", type: "eligibility" },
              { text: "QI", type: "eligibility" },
              { text: "FBDE", type: "eligibility" },
              { text: "QDWI", type: "eligibility" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_EOC_2026.pdf" },
              { type: "Highlights", url: "/downloads/UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UnitedHealthcare Dual Complete KYS4 (D-SNP) H6595-005",
            labels: [
              { text: "QMB", type: "eligibility" },
              { text: "QMB+", type: "eligibility" },
              { text: "SLMB", type: "eligibility" },
              { text: "SLMB+", type: "eligibility" },
              { text: "QI", type: "eligibility" },
              { text: "FBDE", type: "eligibility" },
              { text: "QDWI", type: "eligibility" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYS4_DSNP_H6595-005_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYS4_DSNP_H6595-005_EOC_2026.pdf" },
              { type: "Highlights", url: "/downloads/UHC_Dual_Complete_KYS4_DSNP_H6595-005_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UnitedHealthcare Dual Complete KYV001 (D-SNP) H6595-003",
            labels: [
              { text: "QMB", type: "eligibility" },
              { text: "QMB+", type: "eligibility" },
              { text: "SLMB", type: "eligibility" },
              { text: "SLMB+", type: "eligibility" },
              { text: "QI", type: "eligibility" },
              { text: "FBDE", type: "eligibility" },
              { text: "QDWI", type: "eligibility" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYV001_DSNP_H6595-003_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYV001_DSNP_H6595-003_EOC_2026.pdf" },
              { type: "Highlights", url: "/downloads/UHC_Dual_Complete_KYV001_DSNP_H6595-003_Highlights_2026.pdf" },
            ],
          },
        ],
        "Complete Care": [
          {
            planName: "UnitedHealthcare Complete Care KY6 (C-SNP) H5253-182",
            labels: [
              { text: "Cardiovascular disorders", type: "condition" },
              { text: "Chronic heart failure", type: "condition" },
              { text: "Diabetes", type: "condition" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Complete_Care_KY6_CSNP_H5253-182_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Complete_Care_KY6_CSNP_H5253-182_EOC_2026.pdf" },
              { type: "Highlights", url: "/downloads/UHC_Complete_Care_KY6_CSNP_H5253-182_Highlights_2026.pdf" },
            ],
          },
        ],
      },
      "Tennessee": {
        "AARP": [],
        "Dual Complete": [],
        "Complete Care": [],
      },
      "Ohio": {
        "AARP": [],
        "Dual Complete": [],
        "Complete Care": [],
      },
      "Indiana": {
        "AARP": [],
        "Dual Complete": [],
        "Complete Care": [],
      },
      "West Virginia": {
        "AARP": [],
        "Dual Complete": [],
        "Complete Care": [],
      },
      "Georgia": {
        "AARP": [],
        "Dual Complete": [],
        "Complete Care": [],
      },
      "Virginia": {
        "AARP": [],
        "Dual Complete": [],
        "Complete Care": [],
      },
    },
  },
  {
    id: "wellcare",
    name: "Wellcare",
    logo: wellcareLogo,
    contacts: [
      { type: "John Hensley - Sales Director", subtitle: "Kentucky", number: "(502) 608-5464", email: "John.Hensley@Wellcare.com" },
      { type: "Lindsey Wiglesworth - Broker Manager", subtitle: "Eastern Kentucky", number: "(859) 421-6048", email: "Lindsey.Wiglesworth@Wellcare.com" },
      { type: "Marissa Mudd - Broker Manager", subtitle: "Louisville and Western Kentucky", number: "(502) 407-0009", email: "Marissa.Mudd@Wellcare.com" },
      { type: "Wellcare Broker Services", number: "(866) 594-5456", email: "brokerservices@wellcare.com" },
    ],
    links: [
      { name: "Broker Portal", url: "https://brokerportal.wellcare.com/login" },
      { name: "Provider Search", url: "https://www.wellcare.com/en/Medicare/Find-A-Doctor" },
      { name: "Drug Search", url: "https://www.wellcare.com/en/Medicare/Prescription-Drug-Coverage" },
    ],
    downloads: [
      { name: "2026 KY Market Highlights", url: "/downloads/Wellcare_2026_KY_Market_Highlights.pdf" },
      { name: "Commitment to Broker Service Excellence 2026", url: "/downloads/Wellcare_Commitment_to_Broker_Service_Excellence_2026.pdf" },
      { name: "Medicare Advantage Sales Presentation 2026", url: "/downloads/Wellcare_Medicare_Advantage_Sales_Presentation_2026.pdf" },
      { name: "Formulary", url: "/downloads/Wellcare_Formulary_2026.pdf" },
    ],
    summaryOfBenefits: {
      "Kentucky": {
        "HMO-POS": [
          {
            planName: "Wellcare Assist (HMO-POS) H9730-010",
            documents: [
              { type: "SOB", url: "/downloads/Wellcare_Assist_HMO-POS_H9730-010_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Wellcare_Assist_HMO-POS_H9730-010_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Wellcare_Formulary_2026.pdf" },
            ],
          },
          {
            planName: "Wellcare Simple (HMO-POS) H9730-009",
            documents: [
              { type: "SOB", url: "/downloads/Wellcare_Simple_HMO-POS_H9730-009_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Wellcare_Simple_HMO-POS_H9730-009_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Wellcare_Formulary_2026.pdf" },
            ],
          },
          {
            planName: "Wellcare Giveback (HMO-POS) H9730-007",
            documents: [
              { type: "SOB", url: "/downloads/Wellcare_Giveback_HMO-POS_H9730-007_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Wellcare_Giveback_HMO-POS_H9730-007_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Wellcare_Formulary_2026.pdf" },
            ],
          },
        ],
        "D-SNP": [
          {
            planName: "Wellcare Dual Liberty Sync (D-SNP) H9730-004",
            documents: [
              { type: "SOB", url: "/downloads/Wellcare_Dual_Liberty_Sync_DSNP_H9730-004_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Wellcare_Dual_Liberty_Sync_DSNP_H9730-004_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Wellcare_Formulary_2026.pdf" },
            ],
          },
          {
            planName: "Wellcare Dual Access Sync (D-SNP) H9730-003",
            documents: [
              { type: "SOB", url: "/downloads/Wellcare_Dual_Access_Sync_DSNP_H9730-003_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Wellcare_Dual_Access_Sync_DSNP_H9730-003_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Wellcare_Formulary_2026.pdf" },
            ],
          },
          {
            planName: "Wellcare Dual Access Sync Open (D-SNP) H3975-004",
            documents: [
              { type: "SOB", url: "/downloads/Wellcare_Dual_Access_Sync_Open_DSNP_H3975-004_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Wellcare_Dual_Access_Sync_Open_DSNP_H3975-004_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Wellcare_Formulary_2026.pdf" },
            ],
          },
          {
            planName: "Wellcare Dual Reserve (D-SNP) H9730-011",
            documents: [
              { type: "SOB", url: "/downloads/Wellcare_Dual_Reserve_DSNP_H9730-011_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Wellcare_Dual_Reserve_DSNP_H9730-011_EOC_2026.pdf" },
              { type: "Formulary", url: "/downloads/Wellcare_Formulary_2026.pdf" },
            ],
          },
        ],
      },
      "Tennessee": {
        "HMO-POS": [],
        "D-SNP": [],
      },
      "Ohio": {
        "HMO-POS": [],
        "D-SNP": [],
      },
      "Indiana": {
        "HMO-POS": [],
        "D-SNP": [],
      },
      "West Virginia": {
        "HMO-POS": [],
        "D-SNP": [],
      },
      "Georgia": {
        "HMO-POS": [],
        "D-SNP": [],
      },
      "Virginia": {
        "HMO-POS": [],
        "D-SNP": [],
      },
    },
  },
];

