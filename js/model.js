/* =====================================================================
   MODEL — data and state. Never touches the DOM.
   ===================================================================== */

const Model = {

  githubUser: "Somthin2",

  contactEmail: "thanospavlides1234@gmail.com",

  state: {
    screen: "home",
    menuIndex: 0,
    reposLoaded: false,
    skillsBuilt: false,
  },

  featured: [
    {
      title: "PQC-Signal: Post-Quantum Key Exchange",
      tag: "Cryptography", color: "#a855f7", live: false,
      url: "https://github.com/Somthin2",
      cta: "View on GitHub →",
      img: "assets/projects/pqc-signal.png",
      desc: "Final-year thesis: integrated ML-KEM-768 (NIST post-quantum standard) into Signal Desktop as the key-exchange layer. Graded A. Supervised by Harald Gjermundrod at UNIC.",
    },
    {
      title: "Unico IDtech: Biometric Auth Bypass",
      tag: "Bug Bounty", color: "#e60012", live: false,
      url: "https://hackerone.com",
      cta: "HackerOne Reports →",
      img: "assets/projects/unico.png",
      desc: "Found two critical vulnerabilities: a hardcoded API credentials leak and a bioTokenId cross-CPF binding bypass — one person's biometrics could authenticate a completely different identity.",
    },
    {
      title: "DoD VDP: army.mil Auth Bypass",
      tag: "Gov VDP", color: "#3dff6e", live: false,
      url: "https://hackerone.com/reports",
      cta: "Responsible Disclosure →",
      img: "assets/projects/dod.png",
      desc: "Discovered a potential authentication bypass on a CAMMS app endpoint through the U.S. Department of Defense Vulnerability Disclosure Program, targeting army.mil infrastructure.",
    },
    {
      title: "Wazuh SIEM: RED Cluster Recovery",
      tag: "Security Ops", color: "#f1e05a", live: false,
      url: "https://github.com/Somthin2",
      cta: "View on GitHub →",
      img: "assets/projects/wazuh.png",
      desc: "Recovered a RED OpenSearch cluster (454 unassigned shards), patched a filename-mismatch bug that left 630 malicious IPs unblocked since Aug 2025, and upgraded Suricata 7.0.7→8.0.5.",
    },
  ],

  featuredRepoNames: [],

  fallbackRepos: [
    {
      name: "COMP-431-Email-Security",
      language: "Shell", stargazers_count: 0,
      html_url: "https://github.com/Somthin2",
      description: "Mail server + phishing campaign infrastructure on a custom domain (comp431.dedyn.io). DNS via deSEC, DKIM key gen, GoPhish deployment with SPF/DKIM/DMARC hardening.",
    },
    {
      name: "M365-Phishing-Simulation",
      language: "Python", stargazers_count: 0,
      html_url: "https://github.com/Somthin2",
      description: "Microsoft 365 phishing template for Catalink's GoPhish instance with full SPF/DKIM/DMARC stack. Deployed over SSH tunnel to an internal relay.",
    },
    {
      name: "WiFi-Pentesting-Lab",
      language: "Shell", stargazers_count: 0,
      html_url: "https://github.com/Somthin2",
      description: "WPA2 cracking lab on Kali Linux with an Alfa AWUS036ACM adapter. Practiced with hashcat and aircrack-ng against a controlled home network.",
    },
    {
      name: "PortSwigger-Labs",
      language: "Python", stargazers_count: 0,
      html_url: "https://github.com/Somthin2",
      description: "Writeups and automation scripts for all 52 PortSwigger Server-Side Vulnerabilities labs — SQLi, SSRF, path traversal, access control, OS command injection, file upload exploits.",
    },
  ],

  projectImages: {},

  langColors: {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    PHP: "#4F5D95", CSS: "#663399", HTML: "#e34c26",
    Shell: "#89e051", "Jupyter Notebook": "#DA5B0B", MATLAB: "#e16737",
    Java: "#b07219", C: "#555", "C++": "#f34b7d",
  },

  skills: [
    { group: "Offensive Security", items: [
      ["Web App Pentesting", 90],
      ["Bug Bounty Hunting", 85],
      ["SQLi · SSRF · Path Traversal", 88],
      ["Access Control & Auth Bypass", 86],
      ["OS Command Injection", 82],
      ["WiFi / WPA2 Cracking", 75],
    ]},
    { group: "Defensive & SIEM Ops", items: [
      ["Wazuh SIEM Administration", 85],
      ["Incident Response & Log Recovery", 82],
      ["Suricata IDS", 80],
      ["Phishing Simulation (GoPhish)", 78],
      ["SPF · DKIM · DMARC", 80],
    ]},
    { group: "Cryptography & Recon Tools", items: [
      ["Post-Quantum Cryptography (ML-KEM-768)", 85],
      ["Signal Protocol", 75],
      ["subfinder · httpx · nuclei", 84],
      ["hashcat · aircrack-ng", 80],
      ["Kali Linux · HackTheBox", 88],
    ]},
    { group: "Programming & Infrastructure", items: [
      ["Python", 82],
      ["Linux · Bash", 86],
      ["JavaScript · PHP", 68],
      ["Docker · Cloud Basics (Linode)", 68],
      ["LaTeX (Awesome-CV)", 75],
    ]},
  ],

  async fetchRepos() {
    const skip = new Set(this.featuredRepoNames);
    try {
      const res = await fetch(
        `https://api.github.com/users/${this.githubUser}/repos?per_page=100&sort=updated`
      );
      if (!res.ok) throw new Error(res.status);
      const repos = (await res.json()).filter(r => !r.fork && !skip.has(r.name));
      return { repos, live: true };
    } catch {
      return { repos: this.fallbackRepos.filter(r => !skip.has(r.name)), live: false };
    }
  },
};
