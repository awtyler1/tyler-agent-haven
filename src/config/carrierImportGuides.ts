// Per-carrier portal URLs and download instructions for the carrier tile help links.

export const carrierImportGuides: Record<string, {
  portalName: string;
  portalUrl: string;
  steps: string;
}> = {
  humana: {
    portalName: 'Humana Agent Portal',
    portalUrl: 'https://www.humana.com/agent',
    steps: 'Agent Portal \u2192 Reports \u2192 Monthly Production Report \u2192 Export',
  },
  aetna: {
    portalName: 'Aetna Producer World',
    portalUrl: 'https://www.aetna.com/producer',
    steps: 'Producer World \u2192 Reports \u2192 Book of Business \u2192 Download CSV',
  },
  anthem: {
    portalName: 'Anthem Producer Toolkit',
    portalUrl: 'https://www.anthem.com/producer',
    steps: 'Producer Toolkit \u2192 My Book \u2192 Production Report \u2192 Export',
  },
  wellcare: {
    portalName: 'WellCare Provider Portal',
    portalUrl: 'https://www.wellcare.com/agent',
    steps: 'Agent Portal \u2192 Reports \u2192 Active Enrollment \u2192 Download',
  },
  uhc: {
    portalName: 'UHC Jarvis',
    portalUrl: 'https://jarvis.uhc.com',
    steps: 'Jarvis \u2192 My Production \u2192 Export Report',
  },
  devoted: {
    portalName: 'Devoted Health Broker Portal',
    portalUrl: 'https://broker.devoted.com',
    steps: 'Broker Portal \u2192 My Members \u2192 Export',
  },
};
