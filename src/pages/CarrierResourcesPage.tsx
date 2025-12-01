import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, ExternalLink, Phone, Mail, ChevronDown, MapPin } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";

const carriers = [
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
        "Humana Gold Plus (HMO)": [
          {
            planName: "Humana Gold Plus H5619-071 (HMO) H5619-071-000",
            labels: [
              { text: "Popular Plan", type: "positive" },
            ],
            documents: [
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_H5619-071_HMO_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Gold_Plus_H5619-071_HMO_ANOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana Gold Plus (HMO) H0292-003-000",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_HMO_H0292-003-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_HMO_H0292-003-000_EOC_2026.pdf" },
            ],
          },
        ],
        "C-SNP": [
          {
            planName: "Humana Gold Plus Chronic Kidney Disease (HMO C-SNP) H5619-170-000",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_ANOC_2026.pdf" },
            ],
          },
        ],
        "D-SNP": [
          {
            planName: "Humana Gold Plus SNP-DE H1036-320 (HMO D-SNP) HIDE H1036-320-000",
            labels: [
              { text: "NEW", type: "positive" },
              { text: "Higher Monthly Allowance", type: "positive" },
              { text: "Lower D,V,H", type: "caution" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_SNP-DE_H1036-320_HMO_DSNP_HIDE_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_SNP-DE_H1036-320_HMO_DSNP_HIDE_EOC_2026.pdf" },
            ],
          },
          {
            planName: "HumanaChoice SNP-DE H5525-045 (PPO D-SNP) HIDE H5525-045-000",
            documents: [
              { type: "SOB", url: "/downloads/HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_ANOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana Gold Plus SNP-DE H5619-163 (HMO D-SNP) HIDE H5619-163-000",
            documents: [
              { type: "SOB", url: "/downloads/Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_ANOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana Dual Select H5619-075 (HMO D-SNP) HIDE H5619-075-000",
            labels: [
              { text: "Partial Dual", type: "location" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_ANOC_2026.pdf" },
            ],
          },
        ],
        "PPO": [
          {
            planName: "HumanaChoice H7617-050 (PPO) H7617-050-000",
            documents: [
              { type: "SOB", url: "/downloads/HumanaChoice_H7617-050_PPO_H7617-050-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/HumanaChoice_H7617-050_PPO_H7617-050-000_EOC_2026.pdf" },
            ],
          },
        ],
        "Giveback": [
          {
            planName: "Humana USAA Honor Giveback with Rx (PPO) H7617-005-000",
            labels: [
              { text: "$75 Giveback", type: "positive" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H7617-005-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H7617-005-000_EOC_2026.pdf" },
            ],
          },
          {
            planName: "HumanaChoice Giveback H7617-049 (PPO) H7617-049-000",
            labels: [
              { text: "$129 Giveback", type: "positive" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/HumanaChoice_Giveback_H7617-049_PPO_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/HumanaChoice_Giveback_H7617-049_PPO_EOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana USAA Honor Giveback (PPO) H5216-105-000",
            documents: [
              { type: "SOB", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-105-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-105-000_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-105-000_ANOC_2026.pdf" },
            ],
          },
          {
            planName: "Humana USAA Honor Giveback (PPO) H5216-225-000",
            labels: [
              { text: "$100 Giveback", type: "positive" },
              { text: "High Dental Coverage", type: "positive" },
              { text: "No Drug Coverage", type: "caution" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-225-000_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-225-000_EOC_2026.pdf" },
              { type: "ANOC", url: "/downloads/Humana_USAA_Honor_Giveback_PPO_H5216-225-000_ANOC_2026.pdf" },
            ],
          },
        ],
      },
    },
  },
  {
    id: "uhc",
    name: "UnitedHealthcare",
    logo: uhcLogo,
    contacts: [
      { type: "Mark Reeder - Market Growth Manager", number: "(270) 556-1071", email: "Mark_Reeder@uhc.com" },
      { type: "Producer Help Desk", number: "888-381-8581" },
    ],
    links: [
      { name: "Jarvis Portal", url: "https://www.uhcjarvis.com/content/jarvis/en/sign_in.html#/sign_in" },
      { name: "Provider Directory", url: "https://connect.werally.com/plans/uhc" },
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
        "HMO": [
          {
            planName: "AARP Medicare Advantage Essentials from UHC KY-1 (HMO-POS) H5253-099-000",
            documents: [
              { type: "SOB", url: "/downloads/UHC_AARP_Essentials_KY1_HMO_H5253-099_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_AARP_Essentials_KY1_HMO_H5253-099_EOC_2026.pdf" },
              { type: "Plan Highlights", url: "/downloads/UHC_AARP_Essentials_KY1_HMO_H5253-099_Highlights_2026.pdf" },
            ],
          },
        ],
        "PPO": [],
        "C-SNP": [
          {
            planName: "UHC Complete Care KY-6 (HMO-POS C-SNP) H5253-182-000",
            labels: [
              { text: "Cardiovascular disorders", type: "location" },
              { text: "Chronic heart failure", type: "location" },
              { text: "Diabetes", type: "location" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Complete_Care_KY6_CSNP_H5253-182_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Complete_Care_KY6_CSNP_H5253-182_EOC_2026.pdf" },
              { type: "Plan Highlights", url: "/downloads/UHC_Complete_Care_KY6_CSNP_H5253-182_Highlights_2026.pdf" },
            ],
          },
        ],
        "D-SNP": [
          {
            planName: "UHC Dual Complete KY-S002 (HMO-POS D-SNP) HIDE H6595-004-000",
            labels: [
              { text: "QMB", type: "location" },
              { text: "QMB+", type: "location" },
              { text: "SLMB+", type: "location" },
              { text: "FBDE", type: "location" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYS002_DSNP_H6595-004_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYS002_DSNP_H6595-004_EOC_2026.pdf" },
              { type: "Plan Highlights", url: "/downloads/UHC_Dual_Complete_KYS002_DSNP_H6595-004_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UHC Dual Complete KY-S4 (HMO-POS D-SNP) HIDE H6595-005-000",
            labels: [
              { text: "QMB+", type: "location" },
              { text: "SLMB+", type: "location" },
              { text: "FBDE", type: "location" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYS4_DSNP_H6595-005_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYS4_DSNP_H6595-005_EOC_2026.pdf" },
              { type: "Plan Highlights", url: "/downloads/UHC_Dual_Complete_KYS4_DSNP_H6595-005_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UHC Dual Complete KY-S001 (PPO D-SNP) HIDE H1889-008-000",
            labels: [
              { text: "QMB", type: "location" },
              { text: "QMB+", type: "location" },
              { text: "SLMB+", type: "location" },
              { text: "FBDE", type: "location" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_EOC_2026.pdf" },
              { type: "Plan Highlights", url: "/downloads/UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UHC Dual Complete KY-S3 (PPO D-SNP) HIDE H1889-030-000",
            labels: [
              { text: "QMB+", type: "location" },
              { text: "SLMB+", type: "location" },
              { text: "FBDE", type: "location" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_EOC_2026.pdf" },
              { type: "Plan Highlights", url: "/downloads/UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_Highlights_2026.pdf" },
            ],
          },
          {
            planName: "UHC Dual Complete KY-V001 (HMO-POS D-SNP) HIDE H6595-003-000",
            labels: [
              { text: "QMB", type: "location" },
              { text: "QMB+", type: "location" },
              { text: "SLMB", type: "location" },
              { text: "SLMB+", type: "location" },
              { text: "QI", type: "location" },
              { text: "FBDE", type: "location" },
            ],
            documents: [
              { type: "SOB", url: "/downloads/UHC_Dual_Complete_KYV001_DSNP_H6595-003_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_Dual_Complete_KYV001_DSNP_H6595-003_EOC_2026.pdf" },
              { type: "Plan Highlights", url: "/downloads/UHC_Dual_Complete_KYV001_DSNP_H6595-003_Highlights_2026.pdf" },
            ],
          },
        ],
        "Giveback": [
          {
            planName: "AARP Medicare Advantage Patriot No Rx KY-MA01 (PPO) H8768-020-000",
            documents: [
              { type: "SOB", url: "/downloads/UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_EOC_2026.pdf" },
              { type: "Plan Highlights", url: "/downloads/UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_Highlights_2026.pdf" },
            ],
          },
        ],
      },
    },
  },
  {
    id: "wellcare",
    name: "Wellcare",
    logo: wellcareLogo,
    contacts: [
      { name: "Austin Compton", role: "Regional Agency Manager", region: "Kentucky", email: "Austin.Compton@wellcare.com", phone: "859-297-8759" },
      { name: "Jeff Baker", role: "Regional Agency Manager", region: "Kentucky", email: "Jeffrey.Baker@wellcare.com", phone: "502-365-8918" },
      { type: "Broker Support Call Center", number: "1-866-822-1339" },
    ],
    links: [
      { name: "Broker Portal", url: "https://www.wellcare.com/Broker-Resources/Broker-Resources" },
      { name: "Order Plan Materials", url: "https://1b3050-42a8.icpage.net/sales-and-marketing-resources" },
      { name: "Broker Connect", url: "https://1b3050-42a8.icpage.net/broker-connect-main-page" },
      { name: "Find a Provider", url: "https://my.wellcare.com/x/hub/public/en/landing-page" },
    ],
    downloads: [
      { name: "Wellcare's Commitment to Broker and Service Excellence", url: "/downloads/Wellcare_Commitment_to_Broker_Service_Excellence_2026.pdf" },
      { name: "Medicare Advantage & more. Sales Presentation", url: "/downloads/Wellcare_Medicare_Advantage_Sales_Presentation_2026.pdf" },
      { name: "2026 KY Market Highlights", url: "/downloads/Wellcare_2026_KY_Market_Highlights.pdf" },
    ],
    summaryOfBenefits: {
      "Kentucky": {
        "HMO": [
          {
            planName: "Wellcare Simple (HMO-POS) H9730-009-000",
            documents: [
              { type: "SOB", url: "/downloads/Wellcare_Simple_HMO-POS_H9730-009_SOB_2026.pdf" },
              { type: "EOC", url: "/downloads/Wellcare_Simple_HMO-POS_H9730-009_EOC_2026.pdf" },
            ],
          },
        ],
        "PPO": [],
        "DSNP": [],
      },
    },
  },
];

const CarrierResourcesPage = () => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>(carriers[0].id);
  const activeCarrier = carriers.find(c => c.id === selectedCarrier);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-8 md:pt-40 md:pb-12 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Carrier Resources</h1>
            <p className="text-body max-w-2xl">
              Everything you need, organized by carrier. Fast access. No wasted time.
            </p>
          </div>
        </section>

        {/* Carrier Selection Grid */}
        <section className="px-6 md:px-12 lg:px-20 py-8 bg-cream border-b border-border">
          <div className="container-narrow">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {carriers.map((carrier) => (
                <button
                  key={carrier.id}
                  onClick={() => setSelectedCarrier(carrier.id)}
                  className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg border transition-all ${
                    selectedCarrier === carrier.id
                      ? "border-gold bg-white shadow-md"
                      : "border-border bg-white/50 hover:bg-white hover:border-gold/50"
                  }`}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                    <img 
                      src={carrier.logo} 
                      alt={`${carrier.name} logo`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className={`text-xs md:text-sm font-medium text-center leading-tight ${
                    selectedCarrier === carrier.id ? "text-gold" : "text-muted-foreground"
                  }`}>
                    {carrier.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Selected Carrier Details */}
        {activeCarrier && (
          <section className="section-padding">
            <div className="container-narrow">
              <div className="border border-border rounded-lg p-6 md:p-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-16 h-16 rounded-lg bg-white border border-border flex items-center justify-center p-2">
                    <img 
                      src={activeCarrier.logo} 
                      alt={`${activeCarrier.name} logo`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="heading-section">{activeCarrier.name}</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Contacts */}
                  <div>
                    <h4 className="text-base font-semibold text-gold uppercase tracking-wider mb-4">Contacts</h4>
                    <div className="space-y-4">
                      {activeCarrier.contacts.map((contact, index) => (
                        <div key={index} className="space-y-1">
                          {'name' in contact ? (
                            <>
                              <p className="text-sm font-medium text-foreground">{contact.name}</p>
                              {'role' in contact && contact.role && (
                                <p className="text-xs text-muted-foreground">{contact.role}{('region' in contact && contact.region) ? ` – ${contact.region}` : ''}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground">{contact.type}</p>
                              {'subtitle' in contact && contact.subtitle && (
                                <p className="text-xs text-muted-foreground">{contact.subtitle}</p>
                              )}
                            </>
                          )}
                          <div className="flex flex-col gap-1 mt-1">
                            {(('phone' in contact && contact.phone) || ('number' in contact && contact.number)) && (
                              <a 
                                href={`tel:${'phone' in contact ? contact.phone : contact.number}`}
                                className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                              >
                                <Phone size={14} className="text-gold" />
                                <span>{'phone' in contact ? contact.phone : contact.number}</span>
                              </a>
                            )}
                            {'email' in contact && contact.email && (
                              <a 
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                              >
                                <Mail size={14} className="text-gold" />
                                <span>{contact.email}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h4 className="text-base font-semibold text-gold uppercase tracking-wider mb-4">Quick Links</h4>
                    <div className="space-y-3">
                      {activeCarrier.links.map((link, index) => (
                        <div key={index}>
                          <a 
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                          >
                            <ExternalLink size={14} className="text-gold flex-shrink-0" />
                            <span>{link.name}</span>
                          </a>
                          {'subtext' in link && link.subtext && (
                            <p className="text-xs text-muted-foreground ml-[22px] mt-0.5">{link.subtext}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Downloads */}
                  <div>
                    <h4 className="text-base font-semibold text-gold uppercase tracking-wider mb-4">Downloads</h4>
                    <div className="space-y-3">
                      {'downloads' in activeCarrier && activeCarrier.downloads ? (
                        activeCarrier.downloads.map((download, index) => (
                          <a 
                            key={index}
                            href={download.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                          >
                            <FileText size={14} className="text-gold" />
                            <span>{download.name}</span>
                          </a>
                        ))
                      ) : (
                        <>
                          <button className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth">
                            <FileText size={14} className="text-gold" />
                            <span>Summary of Benefits</span>
                          </button>
                          <button className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth">
                            <FileText size={14} className="text-gold" />
                            <span>Plan Comparison</span>
                          </button>
                          <button className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth">
                            <FileText size={14} className="text-gold" />
                            <span>Commission Schedule</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary of Benefits Section */}
                {'summaryOfBenefits' in activeCarrier && activeCarrier.summaryOfBenefits && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="text-base font-semibold text-gold uppercase tracking-wider mb-6">Plan Documents by State</h4>
                    <Accordion type="multiple" className="space-y-3">
                      {Object.entries(activeCarrier.summaryOfBenefits).map(([state, submarkets]) => (
                        <AccordionItem key={state} value={state} className="border border-border rounded-lg overflow-hidden">
                          <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted hover:no-underline">
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-gold" />
                              <span className="font-semibold text-foreground">{state}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 py-4 bg-background">
                            {Array.isArray(submarkets) ? (
                              /* Direct plans without submarkets */
                              <div className="space-y-4">
                                {(submarkets as Array<{planName: string; nonCommissionable?: boolean; labels?: Array<{text: string; type: string}>; documents: Array<{type: string; url: string; isExternal?: boolean}>}>).map((plan, index) => (
                                  <div key={index} className="border border-border/50 rounded-lg p-4 bg-muted/20">
                                    <p className="text-sm font-medium text-foreground mb-3">
                                      {plan.planName}
                                      {plan.nonCommissionable && (
                                        <span className="ml-2 text-xs font-semibold text-destructive uppercase">NON-COMMISSIONABLE</span>
                                      )}
                                      {plan.labels?.map((label, labelIndex) => (
                                        <span 
                                          key={labelIndex}
                                          className={`ml-2 text-xs font-semibold uppercase ${
                                            label.type === 'caution' ? 'text-amber-500' : label.type === 'location' ? 'text-blue-500' : 'text-emerald-500'
                                          }`}
                                        >
                                          {label.text}
                                        </span>
                                      ))}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {plan.documents.map((doc, docIndex) => (
                                        <a 
                                          key={docIndex}
                                          href={doc.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth px-3 py-1.5 bg-background border border-border rounded-md hover:bg-gold/10 hover:border-gold/30"
                                        >
                                          {doc.isExternal ? (
                                            <ExternalLink size={12} className="text-gold" />
                                          ) : (
                                            <FileText size={12} className="text-gold" />
                                          )}
                                          <span>{doc.type}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : typeof submarkets === 'object' && submarkets !== null ? (
                              <Accordion type="multiple" className="space-y-2">
                                {Object.entries(submarkets as Record<string, Array<{planName: string; nonCommissionable?: boolean; labels?: Array<{text: string; type: string}>; documents: Array<{type: string; url: string; isExternal?: boolean}>}>>).map(([submarket, plans]) => (
                                  <AccordionItem key={submarket} value={submarket} className="border border-border/50 rounded-lg overflow-hidden">
                                    <AccordionTrigger className="px-3 py-2 bg-muted/30 hover:bg-muted/50 hover:no-underline text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">{submarket}</span>
                                        <span className="text-xs text-muted-foreground">
                                          ({plans.length} plan{plans.length !== 1 ? 's' : ''})
                                        </span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 py-3 bg-background">
                                      {plans.length > 0 ? (
                                        <div className="space-y-4">
                                          {plans.map((plan, index) => (
                                            <div key={index} className="border border-border/50 rounded-lg p-4 bg-muted/20">
                                              <p className="text-sm font-medium text-foreground mb-3">
                                                {plan.planName}
                                                {plan.nonCommissionable && (
                                                  <span className="ml-2 text-xs font-semibold text-destructive uppercase">NON-COMMISSIONABLE</span>
                                                )}
                                                {plan.labels?.map((label, labelIndex) => (
                                                  <span 
                                                    key={labelIndex}
                                                    className={`ml-2 text-xs font-semibold uppercase ${
                                                      label.type === 'caution' ? 'text-amber-500' : label.type === 'location' ? 'text-blue-500' : 'text-emerald-500'
                                                    }`}
                                                  >
                                                    {label.text}
                                                  </span>
                                                ))}
                                              </p>
                                              <div className="flex flex-wrap gap-2">
                                                {plan.documents.map((doc, docIndex) => (
                                                  <a 
                                                    key={docIndex}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth px-3 py-1.5 bg-background border border-border rounded-md hover:bg-gold/10 hover:border-gold/30"
                                                  >
                                                    {doc.isExternal ? (
                                                      <ExternalLink size={12} className="text-gold" />
                                                    ) : (
                                                      <FileText size={12} className="text-gold" />
                                                    )}
                                                    <span>{doc.type}</span>
                                                  </a>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground italic">No plans added yet.</p>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No submarkets added yet.</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CarrierResourcesPage;
