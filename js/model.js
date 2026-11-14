/* =====================================================================
   MODEL — data and state. Never touches the DOM.
   ===================================================================== */

const Model = {

  githubUser: "Somthin2",

  contactEmail: "thanospavlides1234@gmail.com",

  state: {
    screen: "home",
    menuIndex: 0,
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

  /* Track-record stickers shown above the project cards */
  stats: [
    { big: "IEEE",    small: "Paper accepted · CSNet'26" },
    { big: "52/52",   small: "PortSwigger server-side labs" },
    { big: "#241",    small: "of 1,200 · HackTheBox CTF" },
    { big: "H1 + IGT", small: "Active on HackerOne & Intigriti" },
  ],

  /* Smaller projects — shown as cards without links */
  ops: [
    { title: "Email Security Infrastructure", tag: "Coursework · COMP-431",
      desc: "Mail server and phishing-campaign infrastructure on a custom domain (comp431.dedyn.io): DNS via deSEC, DKIM key generation, GoPhish deployment hardened with SPF, DKIM and DMARC." },
    { title: "M365 Phishing Simulation", tag: "Catalink · Red team",
      desc: "Microsoft 365 phishing template for an internal GoPhish instance with a full SPF/DKIM/DMARC stack, deployed over an SSH tunnel to an internal relay." },
    { title: "WiFi Pentesting Lab", tag: "Home lab",
      desc: "WPA2 cracking lab on Kali Linux with an Alfa AWUS036ACM adapter — hashcat and aircrack-ng against a controlled home network." },
    { title: "PortSwigger Server-Side Track", tag: "Web security",
      desc: "Completed all 52 Server-Side Vulnerabilities labs — SQLi, SSRF, path traversal, access control, OS command injection and file-upload exploits." },
  ],

  /* key: true = signature skill (highlighted red) */
  skills: [
    { group: "Offensive Security", items: [
      ["Web App Pentesting", true], ["Bug Bounty Hunting", true], ["Burp Suite", true],
      ["SQL Injection"], ["SSRF"], ["Path Traversal"], ["Access Control & Auth Bypass"],
      ["OS Command Injection"], ["subfinder · httpx · nuclei"], ["hashcat · aircrack-ng"],
    ]},
    { group: "Defensive & SIEM Ops", items: [
      ["Wazuh SIEM", true], ["Suricata IDS", true], ["Incident Response"],
      ["Log Recovery"], ["GoPhish"], ["SPF · DKIM · DMARC"], ["iptables · ipset"], ["WireGuard"],
    ]},
    { group: "Cryptography & Research", items: [
      ["Post-Quantum Crypto (ML-KEM-768)", true], ["Signal Protocol"],
      ["Hybrid Key Exchange"], ["IEEE Publication"],
    ]},
    { group: "Programming & Infrastructure", items: [
      ["Python", true], ["Linux · Bash", true], ["TypeScript"], ["Docker"], ["Kali Linux"],
    ]},
  ],
};
