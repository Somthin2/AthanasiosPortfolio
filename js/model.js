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
      title: "Integrating Post-Quantum Cryptography into Signal Desktop",
      tag: "IEEE · CSNet'26", color: "#a855f7", live: false,
      url: "https://edas.info/showPaper.php?m=1571301345",
      cta: "Read the Paper →",
      img: "assets/projects/pqc-signal.png",
      desc: "IEEE paper accepted at CSNet'26 (10th Cyber Security in Networking Conference). Co-authored with Harald Gjermundrød & Ioanna Dionysiou (UNIC). Implements ML-KEM-768 as a hybrid post-quantum layer inside Signal Desktop — wrapping message content before Signal's Double Ratchet encrypts it, achieving NIST Level 3 security with no protocol changes. Journal version submitted to MDPI.",
    },
    {
      title: "IDS Implementation: Suricata + Wazuh",
      tag: "Security Ops", color: "#f1e05a", live: false,
      url: "https://github.com/Somthin2/IDS-Implementation",
      cta: "View on GitHub →",
      img: "assets/projects/wazuh.png",
      desc: "Production IDS/SIEM stack on a Raspberry Pi: Suricata monitoring full network traffic via MikroTik port mirroring, feeding into Wazuh with custom rules and active responses. Includes a multi-threaded Python alert bot pushing real-time notifications to Mattermost, Slack, Telegram, and Discord with 4-hour summaries.",
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
      ["Burp Suite", 88],
    ]},
    { group: "Defensive & SIEM Ops", items: [
      ["Wazuh SIEM Administration", 85],
      ["Incident Response & Log Recovery", 82],
      ["Suricata IDS", 80],
      ["Phishing Simulation (GoPhish)", 78],
      ["SPF · DKIM · DMARC", 80],
      ["iptables · ipset", 80],
      ["WireGuard VPN", 78],
    ]},
    { group: "Cryptography & Recon Tools", items: [
      ["Post-Quantum Cryptography (ML-KEM-768)", 92],
      ["Signal Protocol", 75],
      ["subfinder · httpx · nuclei", 84],
      ["hashcat · aircrack-ng", 80],
      ["Kali Linux · HTB (241st/1,200 CTF)", 88],
    ]},
    { group: "Programming & Infrastructure", items: [
      ["Python", 82],
      ["Linux · Bash", 86],
      ["TypeScript", 78],
      ["Docker", 72],
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
