/**
 * ArchLingo — Phase 1: Internet, Networking & Web Protocol Foundations (Stages 1–10)
 * Authored with SRE rigor, Martin Kleppmann & Alex Xu depth. Zero trivial analogies.
 * Incremental, smooth pedagogical progression from fundamental principles to high-speed protocols.
 */

window.PHASE1_STAGES = [
  {
    id: 1,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "The Client-Server Architecture & Physical Network Limits",
    icon: "🔌",
    company: "Cloudflare",
    concept: {
      beginnerGlossary: [
        {
          term: "Client & Server Architecture",
          plainEnglish: "A distributed system model where clients (user browsers, mobile apps, or other services) initiate requests, and servers (listening host processes) process them and return responses.",
          whyInvented: "Centralizes state, computational resources, and security policies on dedicated, managed servers rather than distributing sensitive databases across millions of untrusted user devices.",
          howItWorks: "The client opens an operating system network socket, connects to the server's IP address and listening port, transmits a request payload, and waits for the server's response."
        },
        {
          term: "Network Interface Card (NIC) & DMA",
          plainEnglish: "The physical hardware chip and transceiver that converts software bytes in computer memory (RAM) into electrical, optical, or radio wave signals on a network cable.",
          whyInvented: "CPUs execute instructions in RAM but cannot directly serialize high-frequency electromagnetic pulses onto physical fiber cables.",
          howItWorks: "The OS kernel queues packet descriptors into a Direct Memory Access (DMA) ring buffer; the NIC autonomously reads this buffer without CPU overhead and serializes bits onto the wire."
        },
        {
          term: "Packet & MTU (Maximum Transmission Unit)",
          plainEnglish: "A packet is a discrete chunk of data containing payload bytes plus protocol routing headers. MTU (typically 1,500 bytes on Ethernet) is the largest single packet allowed on a link.",
          whyInvented: "Transmitting large data streams in discrete packets allows thousands of concurrent connections to share a single fiber line and prevents having to retransmit an entire multi-gigabyte file if one bit is corrupted.",
          howItWorks: "The operating system TCP/IP stack segments large application byte streams into MTU-sized packets, each tagged with destination IP addresses and sequence numbers."
        }
      ],
      architectureCard: {
        title: "Physical Layer Constraints & Packet Processing Pipeline",
        physicalInvariant: "Speed of light in single-mode glass fiber is ~200,000 km/s (~5 µs per km round-trip). Standard Ethernet MTU is 1,500 bytes. A 10Gbps link saturated with 64-byte frames generates 14.88 million packets per second (pps), giving a single CPU core only ~67 nanoseconds per packet.",
        mentalModel: "Every network interaction begins with a Client issuing a request to a Server. The data is written to a kernel socket buffer, segmented into MTU-sized packets, encapsulated with TCP, IP, and Ethernet headers, and transferred to the NIC's transmit ring buffer via DMA. Physical propagation delay enforces an inescapable latency floor: no software optimization can make a transatlantic request faster than the speed of light (~55ms round-trip).",
        flowSteps: [
          "1. Client application initiates request via write() syscall, copying user-space buffer to kernel sk_buff",
          "2. Kernel TCP/IP stack prepends 20-byte TCP header and 20-byte IP header",
          "3. Device driver queues sk_buff descriptor into NIC TX ring buffer via DMA",
          "4. NIC computes Ethernet CRC32 checksum and transmits electrical/optical frame onto physical fiber",
          "5. Server NIC receives frame, fires hardware interrupt (or NAPI poll), and passes packet up kernel stack"
        ],
        formulaTitle: "Physical Network RTT & Wire-Speed Packet Rate Formulas",
        formulaMath: "RTT_min = (2 * Distance) / c_fiber  |  Packet Rate (pps) = Line Rate (bps) / ((Frame Size + 20 preamble/gap bytes) * 8)",
        formulaExplanation: "For a request between London and New York (~5,500 km): RTT >= (2 * 5500 km) / (200,000 km/s) = 55 ms purely in fiber transit. On a 10 Gbps link with minimum 64-byte Ethernet frames: 10,000,000,000 / ((64 + 20) * 8) = 14,880,952 packets/sec. Hardware interrupt handling cannot keep up, requiring NAPI polling or kernel bypass (XDP/DPDK)."
      },
      codeCard: {
        title: "Linux NIC Ring Buffer & Socket Buffer Tuning",
        language: "bash",
        code: "# View dropped packets on physical NIC interface\nethtool -S eth0 | grep -E 'drop|miss|error'\n\n# Increase NIC ring buffer depth to absorb micro-bursts\nethtool -G eth0 rx 4096 tx 4096\n\n# Tune kernel core network receive memory limits (16MB)\nsysctl -w net.core.rmem_max=16777216\nsysctl -w net.core.netdev_max_backlog=10000",
        takeaway: "Under sudden traffic spikes, packet drops occur at the NIC ring buffer before user-space server processes are ever scheduled."
      },
      caseStudyCard: {
        company: "Cloudflare",
        incidentOrChallenge: "Handling multi-hundred-gigabit volumetric DDoS attacks flooding edge servers with 50M+ packets per second.",
        solution: "Implemented eXpress Data Path (XDP) with eBPF at the network driver layer, inspecting and dropping malicious packets before Linux allocates kernel sk_buff structures.",
        keyMetric: "Processed and dropped over 10M attack packets/sec per server with near-zero CPU interrupt overhead."
      },
      simulator: {
        param1Label: "Geographical Distance (km)",
        param1Min: 100,
        param1Max: 15000,
        param1Default: 3500,
        param2Label: "Server Processing Time (ms)",
        param2Min: 1,
        param2Max: 100,
        param2Default: 15
      }
    },
    questions: [
      {
        id: "s1_q1",
        question: "Why can a client in London requesting data from a server in New York (~5,500 km) never receive a response in under ~55 ms, regardless of how powerful the server CPU is?",
        options: [
          "Because DNS servers require at least 100 ms to look up IP addresses",
          "Because the speed of light in fiber optic cables (~200,000 km/s) imposes an immutable physical round-trip propagation floor: (2 * 5,500 km) / (200,000 km/s) = 55 ms",
          "Because standard Ethernet cables only transmit 64 bytes per second",
          "Because the Linux kernel enforces a mandatory 50 ms security pause on all international packets"
        ],
        correctAnswer: 1,
        explanation: "Propagation speed through glass fiber is approximately 2/3 the speed of light in a vacuum (~200,000 km/s). For a 5,500 km path, a signal takes 27.5 ms each way (55 ms round-trip). No algorithm, compiler, or hardware upgrade can violate this physical invariant."
      },
      {
        id: "s1_q2",
        question: "What happens when an IP packet with the Don't Fragment (DF) bit set encounters a network hop with an MTU smaller than the packet size?",
        options: [
          "The router splits the packet into two TCP segments and forwards both",
          "The router drops the packet and transmits an ICMP Fragmentation Needed message back to the sender",
          "The router compresses the payload using gzip and re-evaluates the checksum",
          "The router switches the packet from IPv4 to IPv6"
        ],
        correctAnswer: 1,
        explanation: "Because the DF bit prohibits fragmentation, the intermediate router must drop the oversized packet and return an ICMP Type 3 Code 4 (Destination Unreachable: Fragmentation Needed) message, which enables Path MTU Discovery (PMTUD)."
      },
      {
        id: "s1_q3",
        question: "Why do high-performance networking frameworks (such as Cloudflare's XDP or DPDK) bypass the standard Linux kernel network stack?",
        options: [
          "To avoid paying cloud egress bandwidth charges",
          "To eliminate the overhead of sk_buff memory allocations, context switches, and kernel softirq processing",
          "Because the Linux kernel only supports HTTP/1.0",
          "To encrypt packet headers using hardware TPM keys"
        ],
        correctAnswer: 1,
        explanation: "The standard Linux network stack allocates an sk_buff structure and performs metadata tracking for every packet. Kernel-bypass frameworks (DPDK/XDP) process raw packet descriptors directly from the NIC ring buffer in user space or driver space, cutting per-packet latency from microseconds to tens of nanoseconds."
      }
    ]
  },

  {
    id: 2,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "IP Addressing, Routing & Subnets (IPv4 vs IPv6)",
    icon: "🗺️",
    company: "Google SRE",
    concept: {
      beginnerGlossary: [
        {
          term: "IP Address (IPv4 & IPv6)",
          plainEnglish: "A numerical identifier assigned to a network interface so packets can be routed across interconnected networks.",
          whyInvented: "Physical MAC addresses only work within a single local broadcast domain (Layer 2). Hierarchical IP addresses allow routers to forward packets across the global internet.",
          howItWorks: "IPv4 uses 32 bits (4.3 billion addresses), expressed as four decimal octets. IPv6 uses 128 bits, providing 3.4 * 10^38 unique addresses."
        },
        {
          term: "CIDR & Subnet Mask",
          plainEnglish: "Classless Inter-Domain Routing divides an IP address into a network prefix and a host identifier (e.g., /24 means 24 network bits and 8 host bits).",
          whyInvented: "Without CIDR, global routing tables would have to store entries for every individual machine, causing core router memory to explode.",
          howItWorks: "Routers perform a Longest Prefix Match (LPM) on destination IP addresses against their Forwarding Information Base (FIB) to select the outbound interface."
        }
      ],
      architectureCard: {
        title: "Hierarchical IP Routing & Longest Prefix Match",
        physicalInvariant: "IPv4 header minimum size is 20 bytes; IPv6 header fixed size is 40 bytes. Global BGP routing table size exceeds 950,000 routes in TCAM (Ternary Content-Addressable Memory).",
        mentalModel: "Routers do not know the end-to-end path. When a packet enters an interface, the router extracts the destination IP, searches its FIB for the longest matching subnet mask prefix, decrements Time To Live (TTL), recomputes header checksum (IPv4), and forwards to the next-hop MAC address.",
        flowSteps: [
          "1. Host checks if destination IP matches local subnet mask; if not, forwards to default gateway",
          "2. Gateway router performs Longest Prefix Match (LPM) in hardware TCAM against FIB",
          "3. Router decrements IP TTL by 1; if TTL reaches 0, router drops packet and sends ICMP Time Exceeded",
          "4. Router encapsulates IP packet in new Layer 2 Ethernet frame with next-hop MAC address"
        ],
        formulaTitle: "Usable Host Calculation per Subnet Formula",
        formulaMath: "Usable Hosts = 2^(32 - Prefix Length) - 2",
        formulaExplanation: "In a /24 VPC subnet: 2^(32 - 24) - 2 = 256 - 2 = 254 usable IP addresses (network address .0 and broadcast address .255 are reserved; AWS additionally reserves 5 addresses per subnet: .0, .1, .2, .3, .255)."
      },
      codeCard: {
        title: "Linux IP Route Inspection & Subnet CIDR Calculation",
        language: "bash",
        code: "# View the kernel IP routing table with metric and interface\nip route show\n\n# Trace exact routing decision for a destination IP\nip route get 142.250.190.46\n\n# Add static route for a private VPC microservice subnet\nip route add 10.200.0.0/16 via 10.0.0.1 dev eth0",
        takeaway: "IP routing operates hop-by-hop. Misconfigured subnet masks or missing default gateway routes cause silent blackholing of traffic."
      },
      caseStudyCard: {
        company: "Google SRE",
        incidentOrChallenge: "A BGP route leak by an external ISP advertised a more specific prefix (/24) for Google services, redirecting global search and YouTube traffic through a transit provider in Asia.",
        solution: "Implemented strict RPKI (Resource Public Key Infrastructure) route origin validation and Autonomous System Path filtering at peering borders.",
        keyMetric: "Filtered unauthorized BGP hijack routes in real-time, preventing global transit blackholing."
      },
      simulator: {
        param1Label: "Subnet CIDR Prefix (/N)",
        param1Min: 16,
        param1Max: 30,
        param1Default: 24,
        param2Label: "FIB Routing Table Size (K entries)",
        param2Min: 10,
        param2Max: 1000,
        param2Default: 250
      }
    },
    questions: [
      {
        id: "s2_q1",
        question: "How many usable host IP addresses are available in an IPv4 subnet configured with a /28 CIDR prefix?",
        options: [
          "28 hosts",
          "14 hosts",
          "16 hosts",
          "64 hosts"
        ],
        correctAnswer: 1,
        explanation: "32 total bits - 28 network prefix bits = 4 host bits. 2^4 = 16 total addresses. Subtracting the network address (.0) and broadcast address (.15) leaves 14 usable host IPs."
      },
      {
        id: "s2_q2",
        question: "Why do core internet routers use Longest Prefix Match (LPM) instead of exact match when selecting a forwarding route?",
        options: [
          "Because exact match requires calculating SHA-256 hashes for every packet",
          "Because routing tables aggregate addresses hierarchically; a more specific subnet route (e.g. /24) must take precedence over a broader network route (e.g. /16)",
          "Because IPv4 addresses are stored in reverse alphabetical order",
          "Because exact match only works over wireless 5G connections"
        ],
        correctAnswer: 1,
        explanation: "CIDR allows route aggregation. A router might have a broad default route for 10.0.0.0/8 pointing to Router A, but a specific route for 10.1.2.0/24 pointing to Router B. Longest Prefix Match guarantees traffic destined for 10.1.2.5 correctly uses the more specific /24 route."
      },
      {
        id: "s2_q3",
        question: "What is the primary function of the Time To Live (TTL) field in an IPv4 packet header?",
        options: [
          "It records the millisecond latency of the originating HTTP request",
          "It decrements by 1 at each router hop to prevent misrouted packets from looping indefinitely and consuming all link bandwidth",
          "It forces the client browser to refresh its cached CSS stylesheets",
          "It sets the database transaction timeout limit"
        ],
        correctAnswer: 1,
        explanation: "If routing loops occur due to transient BGP or OSPF convergence failures, packets would circulate forever. The TTL field is decremented by 1 by every router hop. When it hits 0, the packet is discarded and an ICMP Time Exceeded message is returned to the sender."
      }
    ]
  },

  {
    id: 3,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "Port Numbers, Multiplexing & Network Sockets",
    icon: "🚪",
    company: "Netflix",
    concept: {
      beginnerGlossary: [
        {
          term: "Port Number (0–65535)",
          plainEnglish: "A 16-bit number in TCP and UDP headers identifying which specific software process on a host should receive the packet.",
          whyInvented: "An IP address only delivers packets to a computer. A computer runs hundreds of processes simultaneously (web server, database, SSH daemon); port numbers route data to the correct process.",
          howItWorks: "Ports 0–1023 are Well-Known (reserved for system services like HTTP:80, HTTPS:443, SSH:22). Ports 49152–65535 are ephemeral ports used by clients for outbound requests."
        },
        {
          term: "Network Socket (4-Tuple)",
          plainEnglish: "A communication endpoint in the operating system defined by: (Source IP, Source Port, Destination IP, Destination Port, Protocol).",
          whyInvented: "A web server listening on port 443 needs to distinguish between 100,000 different concurrent client connections simultaneously.",
          howItWorks: "The OS kernel multiplexes incoming packets into distinct socket receive queues by hashing the 4-tuple, enabling thousands of connections to share the single port 443."
        }
      ],
      architectureCard: {
        title: "Socket Demultiplexing & Ephemeral Port Exhaustion",
        physicalInvariant: "Total available ports per IP is 65,536 (16 bits). A single client machine calling a single backend IP:Port cannot establish more than ~60,000 concurrent outbound connections without secondary IP addresses or SO_REUSEPORT.",
        mentalModel: "When an application calls listen(port 443), the kernel creates a listening socket descriptor. When a client connects, accept() returns a brand-new file descriptor representing the unique 4-tuple. The original port 443 continues listening for new connections.",
        flowSteps: [
          "1. Web server process executes bind(0.0.0.0, 443) and listen(backlog=1024)",
          "2. Incoming TCP SYN arrives with Source Port 54321 and Destination Port 443",
          "3. Kernel TCP stack identifies the 4-tuple and creates an embryonic socket in SYN queue",
          "4. Once handshake completes, kernel returns new client socket FD to user space via accept()"
        ],
        formulaTitle: "Ephemeral Port Max Connection Formula",
        formulaMath: "Max Outbound Concurrency = (Ephemeral Port Range) * (Target Destination IPs)",
        formulaExplanation: "With default Linux ephemeral port range 32768–60999 (28,232 ports), a reverse proxy communicating with a single upstream IP:Port can sustain at most 28,232 concurrent sockets before failing with EADDRNOTAVAIL."
      },
      codeCard: {
        title: "Expanding Linux Ephemeral Port Range & Socket State Inspection",
        language: "bash",
        code: "# View active socket connection counts grouped by state\nnetstat -nat | awk '{print $6}' | sort | uniq -c\n\n# Expand ephemeral port range to allow maximum outbound concurrency\nsysctl -w net.ipv4.ip_local_port_range=\"1024 65535\"\n\n# Enable fast socket recycling for outbound TIME_WAIT sockets\nsysctl -w net.ipv4.tcp_tw_reuse=1",
        takeaway: "High-throughput API gateways and reverse proxies frequently crash with 'Cannot assign requested address' when outbound ephemeral ports are exhausted."
      },
      caseStudyCard: {
        company: "Netflix",
        incidentOrChallenge: "Zuul edge proxies running on AWS EC2 experienced intermittent 502 Bad Gateway errors under 100,000 RPS loads due to ephemeral port exhaustion against downstream microservice VIPs.",
        solution: "Configured HTTP connection pooling with persistent keep-alive connections, increased local ephemeral port ranges, and enabled multiple downstream backend IP endpoints.",
        keyMetric: "Eliminated EADDRNOTAVAIL socket exhaustion errors; reduced outbound TCP handshake overhead by 88%."
      },
      simulator: {
        param1Label: "Outbound Requests per Second",
        param1Min: 1000,
        param1Max: 50000,
        param1Default: 15000,
        param2Label: "Upstream Target IPs",
        param2Min: 1,
        param2Max: 16,
        param2Default: 2
      }
    },
    questions: [
      {
        id: "s3_q1",
        question: "Can a web server listening on port 443 accept more than 65,535 simultaneous concurrent TCP connections from different clients?",
        options: [
          "No, because the port field in the TCP header is strictly 16 bits (max 65,535)",
          "Yes, because connections are identified by the unique 4-tuple (Source IP, Source Port, Dest IP, Dest Port); millions of clients with distinct IPs can connect to port 443",
          "No, unless the server enables IPv6 jumbo frames",
          "Yes, but only if all clients are using UDP"
        ],
        correctAnswer: 1,
        explanation: "The 65,535 limit applies to port numbers, not total open connections. The operating system identifies each TCP socket using the full 4-tuple. Since every client has a different IP address and source port, a server can support hundreds of thousands of concurrent connections on port 443, bounded only by RAM and file descriptors."
      },
      {
        id: "s3_q2",
        question: "What causes an API gateway or reverse proxy to throw the Linux error 'EADDRNOTAVAIL (Cannot assign requested address)' when opening upstream connections?",
        options: [
          "The backend server's SSL certificate expired",
          "All local ephemeral ports for that specific upstream IP:Port pair are exhausted or trapped in TIME_WAIT state",
          "The domain name was deleted from DNS servers",
          "The CPU L1 cache experienced a parity bit failure"
        ],
        correctAnswer: 1,
        explanation: "When a proxy opens outbound TCP connections to a single destination IP:Port, it must allocate a local ephemeral port. If it exhausts the available ephemeral ports (default ~28,000), or if closed sockets remain in TIME_WAIT for 60 seconds, the kernel cannot allocate a unique 4-tuple and fails with EADDRNOTAVAIL."
      },
      {
        id: "s3_q3",
        question: "Why do high-scale reverse proxies like Nginx and Envoy utilize connection pooling with HTTP keep-alive towards upstream servers?",
        options: [
          "To bypass HTTPS encryption overhead",
          "To reuse existing established TCP sockets across multiple requests, preventing ephemeral port churn and 3-way handshake latency",
          "To force backend microservices to store session state in cookies",
          "To allow clients to download files without paying for internet data"
        ],
        correctAnswer: 1,
        explanation: "Without connection pooling, every client request triggers a new outbound TCP connection, consuming an ephemeral port and incurring 1-2 network round trips of handshake latency. Keeping upstream connections alive allows thousands of requests to pipeline over a pre-warmed pool of persistent sockets."
      }
    ]
  },

  {
    id: 4,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "TCP 3-Way Handshake & Connection Teardown",
    icon: "🤝",
    company: "Amazon AWS",
    concept: {
      beginnerGlossary: [
        {
          term: "TCP 3-Way Handshake (SYN, SYN-ACK, ACK)",
          plainEnglish: "The 3-message negotiation between client and server that establishes a reliable, ordered bidirectional connection before data flows.",
          whyInvented: "IP is best-effort and unreliable. Without handshaking, neither machine knows if the other is listening, what sequence numbers to expect, or how much buffer space is available.",
          howItWorks: "1. Client sends SYN (random Initial Sequence Number X). 2. Server replies with SYN-ACK (ISN Y, ACK X+1). 3. Client replies with ACK (ACK Y+1) and can immediately attach payload data."
        },
        {
          term: "TIME_WAIT State",
          plainEnglish: "A 60-second waiting state entered by whichever side of a TCP connection actively initiates the close.",
          whyInvented: "Ensures any delayed duplicate packets wandering across the internet expire before a new socket reuses the identical 4-tuple, and guarantees the final ACK was received.",
          howItWorks: "Standardized as 2 * MSL (Maximum Segment Lifetime = 2 * 30s = 60s). During this window, the 4-tuple cannot be reallocated unless SO_REUSEPORT or tcp_tw_reuse is configured."
        }
      ],
      architectureCard: {
        title: "TCP Connection State Machine & Handshake Latency Cost",
        physicalInvariant: "Speed of light limits transatlantic RTT to ~70ms. A TCP 3-way handshake requires 1 full RTT before application data can be transmitted. In TLS 1.2, this compounded to 3 RTTs before byte 1.",
        mentalModel: "TCP provides an illusion of a continuous reliable byte stream over an unreliable packet network. Sequence numbers track byte offsets, not packet counts. The handshake synchronizes sequence numbers in both directions.",
        flowSteps: [
          "1. Client -> Server: TCP SYN [Seq=X, MSS=1460, SACK_PERM=1, WScale=7]",
          "2. Server -> Client: TCP SYN-ACK [Seq=Y, Ack=X+1, MSS=1460, SACK_PERM=1, WScale=7]",
          "3. Client -> Server: TCP ACK [Seq=X+1, Ack=Y+1] (May carry HTTP request payload in TCP Fast Open)",
          "4. Teardown: FIN -> ACK -> FIN -> ACK; Active closer remains in TIME_WAIT for 2*MSL"
        ],
        formulaTitle: "Handshake Latency Incurred Before First Data Byte",
        formulaMath: "Connection Latency = 1 RTT (TCP) + 1 RTT (TLS 1.3) = 2 RTTs",
        formulaExplanation: "For a mobile user with 100ms RTT to the server, establishing a new connection takes 200ms before sending an HTTP GET. This is why HTTP/2, HTTP/3, and connection pooling are mandatory for mobile performance."
      },
      codeCard: {
        title: "Kernel SYN Queue Tuning & SYN Cookies Activation",
        language: "bash",
        code: "# Enable TCP SYN Cookies to survive SYN Flood DDoS attacks without memory exhaustion\nsysctl -w net.ipv4.tcp_syncookies=1\n\n# Increase TCP SYN backlog queue size (half-open connections)\nsysctl -w net.ipv4.tcp_max_syn_backlog=4096\n\n# Increase listen backlog for fully established connections waiting for accept()\nsysctl -w net.core.somaxconn=4096",
        takeaway: "When a server is hit by a SYN flood, the SYN queue fills up, causing legitimate new connections to be discarded unless SYN Cookies are enabled."
      },
      caseStudyCard: {
        company: "Amazon AWS",
        incidentOrChallenge: "A major retail client's load balancer experienced connection drops during Prime Day flash sales because client connection spikes overflowed the kernel somaxconn queue.",
        solution: "Tuned net.core.somaxconn and tcp_max_syn_backlog to 16,384, enabled TCP SYN cookies, and implemented upstream keep-alive connection pooling.",
        keyMetric: "Supported 250,000 new connections/sec with zero dropped SYN packets during peak retail traffic."
      },
      simulator: {
        param1Label: "Network RTT Latency (ms)",
        param1Min: 10,
        param1Max: 300,
        param1Default: 80,
        param2Label: "New Connections per Second",
        param2Min: 500,
        param2Max: 20000,
        param2Default: 5000
      }
    },
    questions: [
      {
        id: "s4_q1",
        question: "Why does the client and server exchange random Initial Sequence Numbers (ISNs) during the TCP 3-way handshake rather than both starting at 0?",
        options: [
          "To save 4 bytes of memory in the socket descriptor",
          "To prevent delayed packets from an old, terminated connection from being accepted as valid data in a new connection using the same 4-tuple, and to mitigate blind TCP sequence prediction attacks",
          "Because 0 is reserved for broadcast packets in IEEE 802.3",
          "To negotiate the maximum MTU size"
        ],
        correctAnswer: 1,
        explanation: "If sequence numbers always started at 0, an old delayed packet from a previous connection with the identical 4-tuple could arrive and be mistakenly accepted by the receiver as fresh data. Randomizing the ISN makes cross-connection packet collisions virtually impossible and blocks blind spoofing attacks."
      },
      {
        id: "s4_q2",
        question: "What is the purpose of the TIME_WAIT state in TCP, and which side of the connection enters it?",
        options: [
          "The server enters it to wait for client payment authorization",
          "Whichever side actively initiates connection closure (sends the first FIN) enters TIME_WAIT to ensure delayed packets on the internet expire and to guarantee the remote peer received the final ACK",
          "Both sides enter it simultaneously for exactly 24 hours",
          "Only load balancers enter it to recalculate IP hashing weights"
        ],
        correctAnswer: 1,
        explanation: "The endpoint that sends the initial FIN is the active closer. It must enter TIME_WAIT for 2 * MSL (typically 60 seconds). This guarantees that if its final ACK was lost in transit, it can retransmit the ACK when the remote peer retries its FIN, and prevents wandering delayed packets from corrupting subsequent connections."
      },
      {
        id: "s4_q3",
        question: "How do TCP SYN Cookies protect a server against SYN Flood Denial-of-Service attacks?",
        options: [
          "By sending CAPTCHA challenges inside the TCP payload",
          "By avoiding allocating kernel state in the SYN queue; instead, the server encodes connection parameters cryptographically into the sequence number (ISN) of the SYN-ACK",
          "By blocking all incoming traffic from residential internet providers",
          "By rerouting all SYN packets to a cold storage S3 bucket"
        ],
        correctAnswer: 1,
        explanation: "In a SYN flood, an attacker sends millions of SYN packets with forged IPs, exhausting the server's SYN queue memory. When SYN Cookies are enabled, the server allocates NO state upon receiving a SYN. It generates an ISN containing a cryptographic hash of the 4-tuple and timestamp. When the client returns the ACK, the server validates the cookie and creates the socket on the spot."
      }
    ]
  },

  {
    id: 5,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "Flow Control, Congestion Control (BBR/CUBIC) & Fast UDP",
    icon: "🏎️",
    company: "Google",
    concept: {
      beginnerGlossary: [
        {
          term: "Flow Control (Receive Window - rwnd)",
          plainEnglish: "Mechanism where the receiving machine tells the sender: 'Here is how many bytes of buffer space I have left; do not send more.'",
          whyInvented: "A supercomputer sender could easily overwhelm a slower smartphone receiver's memory buffer, causing buffer overflow and massive packet drops.",
          howItWorks: "Every TCP header contains a 16-bit Window Size field (scaled via Window Scale factor). As the application reads from the socket buffer, rwnd expands."
        },
        {
          term: "Congestion Control (cwnd - CUBIC vs BBR)",
          plainEnglish: "Algorithms run by the sender to prevent choking the intermediate network routers and switches along the path.",
          whyInvented: "If every machine blasted packets at maximum NIC speed, intermediate internet router queues would fill up, creating latency spikes and packet loss (bufferbloat).",
          howItWorks: "Traditional algorithms (CUBIC/Reno) treat packet loss as a signal to cut speed in half. Google BBR models the physical pipe's bandwidth and RTT, avoiding bufferbloat entirely."
        }
      ],
      architectureCard: {
        title: "BBR Bottleneck Bandwidth & Bounded In-Flight Bytes",
        physicalInvariant: "Bandwidth-Delay Product (BDP) = Bottleneck Bandwidth * Min RTT. Sending more bytes than BDP fills intermediate router buffers (bufferbloat), increasing latency without increasing throughput.",
        mentalModel: "The sender's effective transmission window is min(rwnd, cwnd). While rwnd protects the receiver's memory, cwnd protects the internet's router buffers. UDP has neither flow control nor congestion control, which is why video streaming and HTTP/3 implement congestion control in user space (QUIC).",
        flowSteps: [
          "1. Sender calculates BDP = Max Bandwidth * Min RTT",
          "2. Sender paces packets to match the bottleneck transmission rate",
          "3. Receiver sends cumulative ACKs updating the receive window (rwnd)",
          "4. If RTT climbs without throughput increasing, BBR identifies bufferbloat and drains the queue"
        ],
        formulaTitle: "Bandwidth-Delay Product (BDP) Formula",
        formulaMath: "BDP (Bytes) = (Bandwidth in bps / 8) * Round-Trip Time (seconds)",
        formulaExplanation: "On a 10 Gbps link with 40ms RTT: BDP = (10,000,000,000 / 8) * 0.040 = 50,000,000 Bytes (50 MB). To saturate this pipe, the TCP socket window must be configured to at least 50 MB, or throughput will be bottlenecked."
      },
      codeCard: {
        title: "Enabling Google BBR Congestion Control in Linux",
        language: "bash",
        code: "# Check currently active congestion control algorithms\nsysctl net.ipv4.tcp_congestion_control\n\n# Enable Fair Queueing (FQ) packet scheduler required by BBR\nsysctl -w net.core.default_qdisc=fq\n\n# Switch TCP congestion control to BBR (Bottleneck Bandwidth and RTT)\nsysctl -w net.ipv4.tcp_congestion_control=bbr",
        takeaway: "Switching from loss-based CUBIC to model-based BBR often improves throughput on lossy cross-continental links by 2x to 10x while reducing p99 latency."
      },
      caseStudyCard: {
        company: "Google",
        incidentOrChallenge: "YouTube video playback experienced high rebuffering rates in developing countries where network links have high packet loss rates (1-3%) unrelated to network congestion.",
        solution: "Developed and deployed BBR congestion control across all YouTube edge servers, decoupling congestion detection from random packet drops.",
        keyMetric: "Reduced YouTube global network latency by 33% and boosted throughput on packet-lossy mobile networks by over 400%."
      },
      simulator: {
        param1Label: "Packet Loss Rate (%)",
        param1Min: 0,
        param1Max: 10,
        param1Default: 2,
        param2Label: "Round-Trip Time RTT (ms)",
        param2Min: 10,
        param2Max: 200,
        param2Default: 50
      }
    },
    questions: [
      {
        id: "s5_q1",
        question: "Why does traditional loss-based TCP congestion control (such as TCP Reno or CUBIC) perform poorly on links with random wireless packet loss?",
        options: [
          "Because wireless links do not support IPv4",
          "Because it mistakenly interprets non-congestion wireless packet loss as a signal of network congestion and drastically slashes its congestion window (cwnd)",
          "Because TCP sequence numbers cannot exceed 256 over Wi-Fi",
          "Because routers drop all TCP packets that do not contain HTML"
        ],
        correctAnswer: 1,
        explanation: "Loss-based algorithms assume any dropped packet means intermediate router queues are overflowing. On wireless or satellite links, packets often drop due to radio interference or fading. Halving the transmission window on every wireless drop causes throughput to collapse."
      },
      {
        id: "s5_q2",
        question: "What is 'Bufferbloat' and how does it degrade distributed systems performance?",
        options: [
          "A hard drive error where the sector allocation table becomes corrupted",
          "Intermediate router and switch queues become excessively large and chronically full, adding massive queuing latency (hundreds of milliseconds) without increasing link throughput",
          "When a browser tab uses more than 4 GB of RAM",
          "When an SQL database runs out of connection pool slots"
        ],
        correctAnswer: 1,
        explanation: "When router hardware manufacturers added huge packet buffers to prevent packet loss, senders filled them up. Packets sit in deep queues waiting to be forwarded. Throughput remains identical to the physical wire limit, but round-trip latency explodes from 20ms to 800ms."
      },
      {
        id: "s5_q3",
        question: "Why did modern protocols like HTTP/3 (QUIC) migrate from TCP to UDP as their underlying transport?",
        options: [
          "Because UDP is completely unencrypted and faster to inspect",
          "To eliminate Head-of-Line blocking across multiplexed streams and implement custom user-space congestion control without waiting for OS kernel updates",
          "Because TCP was deprecated by the IETF in 2020",
          "Because UDP packets do not require IP addresses"
        ],
        correctAnswer: 1,
        explanation: "In TCP, if a single packet is lost, all multiplexed HTTP/2 streams on that connection stall waiting for the missing segment (Head-of-Line blocking). By building on UDP, QUIC implements stream-independent retransmission and state-of-the-art congestion control entirely in user-space application code."
      }
    ]
  },

  {
    id: 6,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "DNS Hierarchy, Record Types & Anycast Resolvers",
    icon: "🌐",
    company: "Spotify",
    concept: {
      beginnerGlossary: [
        {
          term: "DNS (Domain Name System)",
          plainEnglish: "The globally distributed hierarchical key-value database that maps human-readable domain names (e.g., api.spotify.com) to machine IP addresses.",
          whyInvented: "Humans cannot memorize 32-bit or 128-bit IP numbers for every service, and IP addresses change whenever servers migrate between cloud providers or regions.",
          howItWorks: "Resolution flows down a hierarchy: Root Servers (.) -> Top-Level Domain Servers (.com) -> Authoritative Nameservers (ns1.spotify.com)."
        },
        {
          term: "DNS Record Types (A, AAAA, CNAME, ALIAS)",
          plainEnglish: "Specific data formats stored in DNS: A maps to IPv4, AAAA maps to IPv6, CNAME creates an alias pointing to another domain name.",
          whyInvented: "Different network layers require distinct metadata (mail routing needs MX records; service discovery needs SRV/TXT; dual-stack needs A vs AAAA).",
          howItWorks: "Clients query their local recursive resolver (e.g., 8.8.8.8), which traverses the authoritative hierarchy, caches the result based on TTL (Time-To-Live), and returns the IP."
        }
      ],
      architectureCard: {
        title: "Recursive DNS Resolution Flow & TTL Caching",
        physicalInvariant: "Uncached DNS queries require 4 sequential network hops: Client -> Recursive Resolver -> Root Server -> TLD Server -> Authoritative Nameserver. This can introduce 150–300ms of latency before the first TCP SYN packet.",
        mentalModel: "DNS resolution is heavily cached at multiple tiers: browser DNS cache, operating system cache (systemd-resolved), recursive resolver (ISP/Cloudflare 1.1.1.1), and authoritative edge nameservers deployed with BGP Anycast routing.",
        flowSteps: [
          "1. Browser checks internal DNS cache; if miss, invokes getaddrinfo() OS resolver",
          "2. Recursive resolver queries Root Server (.) for the .com TLD nameserver IP",
          "3. Recursive resolver queries .com TLD server for spotify.com Authoritative Nameserver",
          "4. Authoritative nameserver returns A record (e.g. 35.186.224.25) with TTL=300s; resolver caches answer"
        ],
        formulaTitle: "DNS Cache Availability & Stale Failure Window Formula",
        formulaMath: "Availability Window = Record TTL (seconds)",
        formulaExplanation: "A low TTL (e.g. 10s) enables rapid failover during an outage but floods authoritative nameservers with high QPS. A high TTL (e.g. 86400s) shields DNS infrastructure but traps clients on dead IPs for 24 hours during incidents."
      },
      codeCard: {
        title: "Dig DNS Troubleshooting & Authoritative Query Inspection",
        language: "bash",
        code: "# Trace the entire hierarchical DNS resolution path from root servers\ndig +trace api.spotify.com\n\n# Query authoritative nameserver directly bypassing recursive cache\ndig @ns1.p01.dynect.net api.spotify.com A +nocmd +noall +answer\n\n# Inspect DNS response TTL to verify caching duration\ndig api.spotify.com | grep -E 'IN\\s+A'",
        takeaway: "CNAME records cannot exist at the root zone apex (example.com); modern DNS providers use ALIAS/ANAME pseudo-records to flatten CNAMEs into A records dynamically."
      },
      caseStudyCard: {
        company: "Spotify",
        incidentOrChallenge: "A massive distributed DDoS attack against Dyn DNS took down authoritative DNS for major platforms (Spotify, Twitter, GitHub), causing widespread outages despite origin web servers being 100% healthy.",
        solution: "Migrated to multi-provider authoritative DNS architectures (dual-provider Anycast DNS) so domain resolution succeeds even if an entire DNS provider experiences a total outage.",
        keyMetric: "Achieved 100% DNS uptime redundancy with zero single-point-of-failure DNS vendor risk."
      },
      simulator: {
        param1Label: "DNS Record TTL (Seconds)",
        param1Min: 5,
        param1Max: 3600,
        param1Default: 60,
        param2Label: "Client Request Rate (QPS)",
        param2Min: 1000,
        param2Max: 100000,
        param2Default: 20000
      }
    },
    questions: [
      {
        id: "s6_q1",
        question: "Why cannot a standard DNS CNAME record be placed at the apex/root of a domain (e.g., at 'example.com' instead of 'www.example.com') according to RFC 1034?",
        options: [
          "Because CNAME records are restricted to internal intranet domains",
          "Because if a CNAME record is present for a node, no other records (such as SOA, NS, or MX) can coexist for that same name",
          "Because root domains only support IPv6 AAAA records",
          "Because web browsers reject cookies set on domains with CNAME records"
        ],
        correctAnswer: 1,
        explanation: "RFC 1034 stipulates that if a CNAME record exists for a domain node, no other record types may exist for that node. Because a zone apex (example.com) requires mandatory SOA and NS records, placing a CNAME at the apex violates DNS specifications. Cloud providers solve this using proprietary ALIAS or CNAME Flattening records."
      },
      {
        id: "s6_q2",
        question: "What is the engineering trade-off of configuring a very low DNS Time-To-Live (e.g., TTL = 5 seconds) on a public API domain?",
        options: [
          "It permanently disables HTTPS certificate verification",
          "It enables rapid traffic rerouting during a data center failover, but dramatically increases client latency (due to repeated DNS lookups) and multiplies query load on authoritative nameservers",
          "It causes ISP routers to block TCP connections on port 443",
          "It compresses HTTP JSON payloads"
        ],
        correctAnswer: 1,
        explanation: "A 5-second TTL ensures that if an IP address changes or fails, clients discover the new IP almost immediately. However, clients cannot reuse cached results across requests, adding 50–150ms DNS resolution delays to user sessions and dramatically driving up DNS hosting query costs."
      },
      {
        id: "s6_q3",
        question: "How does BGP Anycast allow multiple physical DNS servers around the world to share the exact same IP address (e.g., Cloudflare's 1.1.1.1)?",
        options: [
          "By running a global VPN tunnel between all data centers",
          "Multiple data centers advertise the identical IP prefix via BGP; internet routers route client packets to whichever physical location has the shortest topological AS-Path",
          "By dynamically rewriting client DNS packets at satellite ground stations",
          "By storing all domain names inside a centralized master MySQL instance in Kansas"
        ],
        correctAnswer: 1,
        explanation: "With BGP Anycast, hundreds of edge POPs around the globe announce the same IP subnet to their upstream transit providers. The internet's routing fabric automatically directs each client's packets to the topologically closest data center, slashing latency and naturally dispersing DDoS attack traffic across all global nodes."
      }
    ]
  },

  {
    id: 7,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "HTTP/1.1 vs HTTP/2 Multiplexing & HTTP/3",
    icon: "📄",
    company: "Twitter / X",
    concept: {
      beginnerGlossary: [
        {
          term: "HTTP Keep-Alive (Persistent Connections)",
          plainEnglish: "A mechanism that keeps a single TCP connection open to transmit multiple successive HTTP requests and responses.",
          whyInvented: "HTTP/1.0 closed the TCP connection after every single resource (HTML, image, CSS), forcing expensive 3-way handshakes and slow-start penalties for every asset.",
          howItWorks: "The client includes the header 'Connection: keep-alive'. The server keeps the socket open until an idle timeout expires or the client sends 'Connection: close'."
        },
        {
          term: "Head-of-Line (HoL) Blocking",
          plainEnglish: "A bottleneck where a slow or delayed item in a queue holds up all subsequent items behind it.",
          whyInvented: "In HTTP/1.1, requests on a single connection must be answered strictly in order. If request #1 takes 2 seconds (e.g., slow database query), requests #2 and #3 cannot be returned even if ready.",
          howItWorks: "HTTP/2 solved application-layer HoL blocking by breaking requests into binary frames interleaved over one connection. HTTP/3 solved transport-layer HoL blocking by migrating to independent UDP/QUIC streams."
        }
      ],
      architectureCard: {
        title: "Evolution of Web Protocols & Multiplexed Binary Framing",
        physicalInvariant: "Opening multiple parallel TCP connections in HTTP/1.1 wastes server memory (~40KB per socket) and competes for bandwidth during slow start. HTTP/2 multiplexes unlimited streams over 1 connection.",
        mentalModel: "HTTP/1.1 is plain text and strictly serial. HTTP/2 converts text headers and bodies into binary frames (HEADERS frame, DATA frame) stamped with a 31-bit Stream ID, allowing interleaved responses over a single TCP connection. HTTP/3 moves this architecture onto UDP/QUIC.",
        flowSteps: [
          "1. Client negotiates HTTP/2 via TLS ALPN (Application-Layer Protocol Negotiation: h2)",
          "2. Client transmits Stream 1 (GET /api/user) and Stream 3 (GET /logo.png) concurrently",
          "3. Server processes requests asynchronously in worker threads",
          "4. Server interleaves DATA frames for Stream 3 before Stream 1 completes without blocking"
        ],
        formulaTitle: "HTTP/1.1 vs HTTP/2 Connection Overhead Formula",
        formulaMath: "TCP Handshake Overhead = N_assets * (1 RTT) [HTTP/1.0] vs 1 RTT total [HTTP/2]",
        formulaExplanation: "A modern web page loading 80 assets over HTTP/1.0 required 80 handshakes. HTTP/1.1 browsers opened 6 parallel connections. HTTP/2 downloads all 80 assets over 1 single connection with 0 duplicate handshakes."
      },
      codeCard: {
        title: "Nginx HTTP/2 & Keepalive Configuration",
        language: "nginx",
        code: "server {\n    listen 443 ssl http2;\n    server_name api.example.com;\n\n    # Keep connections open for 1000 requests or 75 seconds idle\n    keepalive_timeout 75s;\n    keepalive_requests 1000;\n\n    # Enable HPACK header compression to save mobile bandwidth\n    http2_max_field_size 16k;\n    http2_max_header_size 32k;\n}",
        takeaway: "In HTTP/2, client browsers reuse a single TCP connection for all assets, dramatically reducing CPU TLS termination load on reverse proxies."
      },
      caseStudyCard: {
        company: "Twitter / X",
        incidentOrChallenge: "Rendering user timelines required loading dozens of small avatars and media thumbnails; browsers hit the HTTP/1.1 6-connection-per-domain limit, stalling page render times.",
        solution: "Upgraded edge load balancers to HTTP/2, enabling multiplexed fetching of all timeline assets over a single persistent TCP connection with HPACK header compression.",
        keyMetric: "Reduced p95 page load latency by 28% and decreased edge TLS handshake volume by 72%."
      },
      simulator: {
        param1Label: "Page Assets Count",
        param1Min: 10,
        param1Max: 150,
        param1Default: 60,
        param2Label: "Round-Trip Time RTT (ms)",
        param2Min: 20,
        param2Max: 250,
        param2Default: 100
      }
    },
    questions: [
      {
        id: "s7_q1",
        question: "What is 'TCP Head-of-Line Blocking' in HTTP/2, and how does HTTP/3 (QUIC) resolve it?",
        options: [
          "It refers to DNS resolvers blocking ad domains",
          "In HTTP/2, because all multiplexed streams share a single TCP connection, one dropped packet stalls the TCP receive buffer for ALL streams; HTTP/3 uses UDP/QUIC where each stream has independent loss recovery",
          "It is a bug in JavaScript V8 engine that crashes single-page apps",
          "It forces all HTTP responses to be encoded in gzip format"
        ],
        correctAnswer: 1,
        explanation: "While HTTP/2 eliminated application-layer HoL blocking (requests no longer wait for earlier responses to complete), it introduced transport-layer HoL blocking. Because TCP enforces strict in-order delivery of bytes, a single dropped packet forces the kernel to halt delivery of all streams until that packet is retransmitted. HTTP/3 runs on UDP with independent per-stream retransmission."
      },
      {
        id: "s7_q2",
        question: "Why did modern browsers historically enforce a limit of 6 simultaneous TCP connections per domain in HTTP/1.1?",
        options: [
          "Because 6 is the maximum number of CPU cores in a standard laptop",
          "To balance parallel resource fetching against overwhelming server socket buffers and congesting client home routers",
          "Because IPv4 only supports 6 IP subnets",
          "To comply with European Union privacy regulations"
        ],
        correctAnswer: 1,
        explanation: "Without a connection limit, a single webpage loading 100 assets would open 100 parallel TCP connections simultaneously, swamping server connection pools, triggering SYN floods on firewalls, and congesting the local network. Six connections was the empirical balance between parallel speed and network civility."
      },
      {
        id: "s7_q3",
        question: "What is the primary function of HPACK in HTTP/2?",
        options: [
          "It compresses image assets from PNG into WebP format",
          "It maintains a shared stateful index table between client and server to compress repetitive HTTP headers (e.g., User-Agent, Cookie) down to single-byte references",
          "It encrypts database passwords stored in server memory",
          "It compiles JavaScript source code into WebAssembly"
        ],
        correctAnswer: 1,
        explanation: "In HTTP/1.1, redundant headers (Cookies, User-Agents, Bearer tokens) were sent repeatedly in plaintext on every request, wasting 1-2 KB per request. HPACK maintains dynamic header tables on both client and server; repeated headers are transmitted as tiny integer index lookups (often 1 or 2 bytes)."
      }
    ]
  },

  {
    id: 8,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "Symmetric vs Asymmetric Encryption & Why Plaintext Failed",
    icon: "🔐",
    company: "Stripe",
    concept: {
      beginnerGlossary: [
        {
          term: "Symmetric Encryption (AES-GCM / ChaCha20)",
          plainEnglish: "A cryptographic algorithm that uses the exact same secret key to both encrypt and decrypt data.",
          whyInvented: "Extremely fast and lightweight in hardware (modern CPUs have dedicated AES-NI instructions capable of encrypting gigabytes per second).",
          howItWorks: "Both parties must already possess the identical shared secret key. If an eavesdropper intercepts the key, all communication is compromised."
        },
        {
          term: "Asymmetric Encryption (RSA / ECC / Diffie-Hellman)",
          plainEnglish: "A cryptographic system that uses a mathematically linked pair of keys: a Public Key (freely shared) and a Private Key (kept secret).",
          whyInvented: "Solves the fundamental key exchange paradox: How can two strangers across an insecure internet securely agree on a secret key without anyone intercepting it?",
          howItWorks: "Data encrypted with the Public Key can ONLY be decrypted by the matching Private Key. However, asymmetric math is ~1,000x slower than symmetric encryption."
        }
      ],
      architectureCard: {
        title: "Hybrid Cryptosystem Architecture: The Foundation of TLS",
        physicalInvariant: "Asymmetric RSA-2048 operations consume ~1,000x more CPU cycles than symmetric AES-256 operations. High-scale servers cannot encrypt full payloads with asymmetric math without CPU exhaustion.",
        mentalModel: "Modern secure protocols never use asymmetric encryption to encrypt data payloads. Instead, they use a Hybrid Cryptosystem: Asymmetric cryptography (Diffie-Hellman) is used for 100 milliseconds to securely exchange a temporary symmetric session key. Once established, all application bytes are encrypted using high-speed symmetric AES-GCM.",
        flowSteps: [
          "1. Client and server perform asymmetric key exchange (ECDHE - Elliptic Curve Diffie-Hellman)",
          "2. Both parties independently derive an identical symmetric Session Key",
          "3. Asymmetric keys are discarded for the remainder of the session",
          "4. Application data is encrypted/decrypted using hardware-accelerated symmetric AES-GCM"
        ],
        formulaTitle: "Computational Performance Ratio Formula",
        formulaMath: "Throughput Ratio = AES-256 Throughput (~4,000 MB/s) / RSA-2048 Throughput (~4 MB/s)",
        formulaExplanation: "CPUs with AES-NI instructions encrypt at line speed (4+ GB/s per core). Pure asymmetric encryption would bottleneck server throughput to under 50 Mbps, requiring 100x more servers to terminate SSL."
      },
      codeCard: {
        title: "Inspecting Hardware Cryptographic Acceleration (AES-NI)",
        language: "bash",
        code: "# Verify CPU hardware support for AES-NI hardware acceleration\ngrep -m1 -o 'aes' /proc/cpuinfo\n\n# Benchmark raw OpenSSL symmetric vs asymmetric encryption speed\nopenssl speed aes-256-gcm\nopenssl speed rsa2048",
        takeaway: "Always select AES-GCM or ChaCha20-Poly1305 ciphers in production to leverage silicon-level cryptographic coprocessors."
      },
      caseStudyCard: {
        company: "Stripe",
        incidentOrChallenge: "Encrypting credit card numbers and financial transaction payloads at REST API endpoints without adding tens of milliseconds of CPU encryption latency.",
        solution: "Architected a hybrid cryptosystem using envelope encryption: credit card tokens are encrypted with ephemeral symmetric data keys, which are wrapped with master asymmetric KMS keys.",
        keyMetric: "Achieved sub-millisecond encryption overhead while maintaining PCI-DSS Level 1 compliance."
      },
      simulator: {
        param1Label: "Payload Size (KB)",
        param1Min: 1,
        param1Max: 1000,
        param1Default: 64,
        param2Label: "Server CPU Cores",
        param2Min: 1,
        param2Max: 64,
        param2Default: 8
      }
    },
    questions: [
      {
        id: "s8_q1",
        question: "Why doesn't HTTPS use asymmetric encryption (such as RSA) to encrypt all user data transferred between client and server?",
        options: [
          "Because asymmetric encryption can only encrypt text files, not binary images",
          "Because asymmetric encryption is mathematically complex and roughly 1,000 times slower than symmetric encryption, which would melt server CPUs at scale",
          "Because public keys expire after exactly 60 seconds",
          "Because RSA encryption was banned by the W3C"
        ],
        correctAnswer: 1,
        explanation: "Asymmetric cryptography involves exponentiation of huge prime numbers (e.g. 2048 or 4096 bits). It is computationally expensive. HTTPS uses asymmetric cryptography solely during the initial handshake to safely establish a shared symmetric session key; subsequent traffic uses high-speed hardware-accelerated symmetric ciphers (AES-GCM)."
      },
      {
        id: "s8_q2",
        question: "In public-key cryptography, if Alice wants to send an encrypted message to Bob that ONLY Bob can read, which key must Alice use to encrypt the message?",
        options: [
          "Alice's private key",
          "Bob's public key",
          "Alice's public key",
          "Bob's private key"
        ],
        correctAnswer: 1,
        explanation: "To guarantee that only Bob can read the message, Alice must encrypt it with Bob's Public Key. Because public and private keys are mathematically paired, the only key in the universe that can reverse that encryption is Bob's matching Private Key, which only Bob possesses."
      },
      {
        id: "s8_q3",
        question: "What security vulnerability exists if an application uses symmetric encryption without an Authenticated Encryption with Associated Data (AEAD) mode like AES-GCM?",
        options: [
          "The data size triples automatically",
          "An attacker who intercepts the ciphertext can alter bits in transit (bit-flipping attacks) without detection because the payload lacks cryptographic integrity verification",
          "The client's IP address is exposed to the local network",
          "The CPU cannot use AES-NI hardware instructions"
        ],
        correctAnswer: 1,
        explanation: "Traditional encryption modes (like AES-CBC) only provide confidentiality (privacy), not integrity. An attacker can tamper with ciphertext bytes in transit, causing predictable plaintext changes upon decryption. Modern systems require AEAD ciphers (AES-GCM or ChaCha20-Poly1305) which produce a cryptographic authentication tag that fails decryption if a single bit is modified."
      }
    ]
  },

  {
    id: 9,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "Digital Certificates, Certificate Authorities & PKI",
    icon: "📜",
    company: "GitHub",
    concept: {
      beginnerGlossary: [
        {
          term: "Man-in-the-Middle (MitM) Attack",
          plainEnglish: "An attack where an adversary sits between client and server, intercepting communication and masquerading as the other party to steal passwords.",
          whyInvented: "Without identity verification, a client negotiating encryption with 'bank.com' could unknowingly be negotiating encryption with an attacker's router.",
          howItWorks: "The attacker intercepts the client's connection, presents their own public key to the client, and opens a separate connection to the real bank."
        },
        {
          term: "Certificate Authority (CA) & PKI",
          plainEnglish: "A mutually trusted third-party organization (e.g., Let's Encrypt, DigiCert) that digitally signs a server's public key to verify ownership of a domain.",
          whyInvented: "Clients need an authoritative cryptographic way to verify that a public key actually belongs to 'github.com' and not an imposter.",
          howItWorks: "Operating systems and browsers ship with a pre-installed 'Root CA Trust Store'. If a server's certificate is signed by a recognized Root or Intermediate CA, the browser trusts it."
        }
      ],
      architectureCard: {
        title: "Certificate Chain of Trust & Cryptographic Verification",
        physicalInvariant: "Cryptographic digital signatures use asymmetric hashing: Signature = PrivateKey_CA(SHA-256(ServerDetails + ServerPublicKey)). Anyone can verify the signature using the CA's public key.",
        mentalModel: "Trust is rooted in the browser's built-in root store. When connecting to a website, the server presents a leaf certificate and intermediate certificates. The client verifies signatures up the chain until it reaches a trusted root certificate.",
        flowSteps: [
          "1. Server sends its Leaf Certificate + Intermediate CA Certificate to client during TLS handshake",
          "2. Client computes SHA-256 digest of leaf certificate fields",
          "3. Client uses Intermediate CA's public key to decrypt the signature and verify hash equality",
          "4. Client verifies Intermediate CA signature against Root CA embedded in OS Trust Store"
        ],
        formulaTitle: "Certificate Validation Checklist Formula",
        formulaMath: "Valid = (Hash Match) AND (Now() < Expiration) AND (Domain == SAN) AND (!Revoked)",
        formulaExplanation: "A certificate is rejected by the browser if any check fails: 1. Signature validation, 2. Timestamp validity window, 3. Subject Alternative Name (SAN) matches host, 4. OCSP/CRL revocation check."
      },
      codeCard: {
        title: "OpenSSL Certificate Inspection & SAN Verification",
        language: "bash",
        code: "# View full certificate chain and expiration for a remote host\nopenssl s_client -connect github.com:443 -showcerts\n\n# Extract and inspect Subject Alternative Names (SAN) from a cert file\nopenssl x509 -in cert.pem -noout -text | grep -A1 'Subject Alternative Name'\n\n# Check certificate expiration date from the command line\nopenssl x509 -in cert.pem -noout -enddate",
        takeaway: "Certificate outages in distributed systems almost always result from automated renewal pipeline failures or missed SAN domain coverage."
      },
      caseStudyCard: {
        company: "GitHub",
        incidentOrChallenge: "A critical internal SSL certificate expired, breaking SSH authentication and internal RPC services across the distributed microservice cluster.",
        solution: "Implemented automated ACME protocol certificate provisioning using HashiCorp Vault with automated 30-day renewal cycles and Prometheus alerts at 15 days.",
        keyMetric: "Automated 100% of internal and external certificate lifecycles, eliminating expired certificate downtime."
      },
      simulator: {
        param1Label: "Days to Certificate Expiration",
        param1Min: 1,
        param1Max: 90,
        param1Default: 14,
        param2Label: "Cluster Node Count",
        param2Min: 5,
        param2Max: 500,
        param2Default: 50
      }
    },
    questions: [
      {
        id: "s9_q1",
        question: "What prevents an attacker on a coffee shop Wi-Fi network from creating their own SSL certificate for 'google.com' and reading your traffic?",
        options: [
          "The coffee shop router automatically blocks all encryption",
          "The attacker's certificate will not be signed by a trusted Certificate Authority in your device's root store; your browser will block the connection with an untrusted certificate error",
          "Google's IP address cannot be typed into untrusted computers",
          "The Wi-Fi password prevents encryption tampering"
        ],
        correctAnswer: 1,
        explanation: "Anyone can generate a self-signed certificate for 'google.com', but browsers only trust certificates signed by a trusted Certificate Authority (CA) in the operating system's root store. Because the attacker does not possess the CA's private key, they cannot forge a valid signature, and the browser aborts the connection."
      },
      {
        id: "s9_q2",
        question: "What is the function of the Subject Alternative Name (SAN) extension in a modern X.509 certificate?",
        options: [
          "It lists alternate IP addresses of DNS root servers",
          "It specifies all domain names, subdomains, and wildcard domains that this single certificate is cryptographically valid for",
          "It stores the user's credit card billing address",
          "It specifies the database username for MySQL"
        ],
        correctAnswer: 1,
        explanation: "The legacy Common Name (CN) field only supported a single domain. The SAN extension allows a certificate to cover multiple domains and wildcards (e.g., example.com, www.example.com, api.example.com). Modern TLS clients ignore the CN field entirely and require valid SAN entries."
      },
      {
        id: "s9_q3",
        question: "How does OCSP Stapling improve TLS handshake performance and client privacy?",
        options: [
          "It embeds client passwords directly inside the TLS ClientHello",
          "The web server periodically fetches and cryptographically caches the CA's revocation status and 'staples' it to the handshake, preventing the client from contacting the CA directly",
          "It compresses the web page using brotli compression",
          "It switches the connection to an unencrypted tunnel"
        ],
        correctAnswer: 1,
        explanation: "Without OCSP Stapling, every client connecting to an HTTPS site must make a separate HTTP call to the CA's OCSP server to verify if the cert was revoked, leaking client browsing history and adding 100ms+ latency. With stapling, the server fetches the signed OCSP response every few hours and includes it directly in the TLS handshake."
      }
    ]
  },

  {
    id: 10,
    section: 1,
    sectionTitle: "Phase 1: Internet, Networking & Web Protocol Foundations",
    title: "The Modern TLS 1.3 Cryptographic Handshake",
    icon: "🛡️",
    company: "Cloudflare",
    concept: {
      beginnerGlossary: [
        {
          term: "Forward Secrecy (PFS - Perfect Forward Secrecy)",
          plainEnglish: "A cryptographic property ensuring that even if an attacker steals a server's private key in the year 2030, they CANNOT decrypt past recorded traffic from today.",
          whyInvented: "In older TLS versions using static RSA key exchange, an adversary who recorded encrypted traffic could decrypt years of historical communications if the server's private key was ever leaked or subpoenaed.",
          howItWorks: "Uses ephemeral Diffie-Hellman keys (ECDHE). Unique temporary keys are generated for each individual session and erased from RAM immediately after session termination."
        },
        {
          term: "TLS 1.3 1-RTT & 0-RTT Handshake",
          plainEnglish: "TLS 1.3 cuts the handshake latency down from 2 network round trips (TLS 1.2) to just 1 round trip (or 0-RTT on resumed connections).",
          whyInvented: "Mobile users on cellular networks experienced severe latency when loading secure websites due to multiple back-and-forth round trips.",
          howItWorks: "The client guesses the server's preferred elliptic curve cipher and sends its Diffie-Hellman public key share directly inside the very first ClientHello message."
        }
      ],
      architectureCard: {
        title: "TLS 1.3 Handshake Packet Flow & Ephemeral Key Derivation",
        physicalInvariant: "TLS 1.2 required 2 full RTTs for the cryptographic handshake + 1 RTT for TCP = 3 RTTs before data. TLS 1.3 achieves 1-RTT (combined TCP+TLS in 2 RTTs) and eliminates obsolete vulnerable ciphers (RC4, 3DES, CBC).",
        mentalModel: "In TLS 1.3, the client sends its supported ciphers AND its ephemeral Diffie-Hellman key share in message #1. The server responds with its key share and certificate, immediately derives the shared secret, and finishes the handshake in half the time of TLS 1.2.",
        flowSteps: [
          "1. Client -> Server: ClientHello [KeyShare=Client_ECDH_Public, SupportedGroups, Ciphers]",
          "2. Server -> Client: ServerHello [KeyShare=Server_ECDH_Public] + EncryptedExtensions + Certificate + Finished",
          "3. Both parties compute SharedSecret = ECDH(Client_Private, Server_Public)",
          "4. Client -> Server: Finished + Immediate Application Data (HTTP GET /)"
        ],
        formulaTitle: "TLS 1.3 Connection Latency Reduction Formula",
        formulaMath: "Latency Savings = 1 RTT * Round-Trip Time",
        formulaExplanation: "For a mobile user with 120ms RTT to an origin server, TLS 1.3 saves a full 120ms on every new connection establishment compared to TLS 1.2."
      },
      codeCard: {
        title: "Hardening Nginx with TLS 1.3 Only & PFS Ciphers",
        language: "nginx",
        code: "server {\n    listen 443 ssl http2;\n    server_name api.enterprise.com;\n\n    # Enforce modern TLS 1.3 protocol only\n    ssl_protocols TLSv1.3;\n\n    # Use secure AEAD ciphers with Perfect Forward Secrecy (PFS)\n    ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;\n    ssl_prefer_server_ciphers off;\n\n    # Enable TLS session resumption caching to accelerate repeat visits\n    ssl_session_cache shared:SSL:10m;\n    ssl_session_timeout 1d;\n}",
        takeaway: "Disabling legacy TLS 1.0, 1.1, and 1.2 closes vulnerabilities like POODLE, BEAST, and Heartbleed while forcing 1-RTT connection speeds."
      },
      caseStudyCard: {
        company: "Cloudflare",
        incidentOrChallenge: "Global mobile web performance was hindered by 2-RTT TLS 1.2 handshakes, while corporate networks suffered from eavesdropping vulnerabilities due to static RSA key exchanges.",
        solution: "Pioneered early global deployment of TLS 1.3 across all edge proxies, enforcing ephemeral X25519 elliptic curve key exchange and 0-RTT session resumption.",
        keyMetric: "Saved over 30 billion round trips daily, cutting average mobile HTTPS connection time by 48%."
      },
      simulator: {
        param1Label: "Mobile Network RTT (ms)",
        param1Min: 20,
        param1Max: 300,
        param1Default: 120,
        param2Label: "TLS Protocol Version",
        param2Min: 1,
        param2Max: 3,
        param2Default: 3
      }
    },
    questions: [
      {
        id: "s10_q1",
        question: "How does Perfect Forward Secrecy (PFS) protect encrypted communication against retroactive decryption?",
        options: [
          "It forces users to change their account passwords every 24 hours",
          "It generates unique, temporary (ephemeral) session keys via Diffie-Hellman that are discarded after the session; compromising the server's long-term private key later cannot decrypt past recorded sessions",
          "It deletes the server's database logs automatically",
          "It encrypts DNS requests over satellite links"
        ],
        correctAnswer: 1,
        explanation: "Without PFS, if a server's private key was stolen, an attacker who had recorded years of encrypted internet traffic could decrypt all past sessions. With PFS (mandatory in TLS 1.3), each session derives temporary ephemeral keys (ECDHE) that are never written to disk and are erased from memory when the session ends."
      },
      {
        id: "s10_q2",
        question: "How did TLS 1.3 achieve a 1-RTT handshake compared to the 2-RTT handshake in TLS 1.2?",
        options: [
          "By removing encryption entirely from the initial handshake",
          "By speculative key exchange: the client sends its Diffie-Hellman public key share directly inside the ClientHello message, allowing the server to complete key derivation in its very first response",
          "By skipping certificate verification on mobile phones",
          "By sending all web traffic over unencrypted UDP"
        ],
        correctAnswer: 1,
        explanation: "In TLS 1.2, the client and server had to first negotiate which cipher suite to use before exchanging key material. TLS 1.3 pruned insecure ciphers down to a handful of modern algorithms, allowing the client to send its key share in the first packet. The server derives the keys and replies immediately, cutting an entire round trip."
      },
      {
        id: "s10_q3",
        question: "What security risk is introduced when enabling TLS 1.3 0-RTT (Zero Round-Trip Time) early data resumption?",
        options: [
          "Passwords are transmitted in plaintext ASCII format",
          "0-RTT early data is vulnerable to replay attacks, where an attacker intercepts and resends the encrypted initial request (e.g. duplicating a payment POST request)",
          "The browser's cookies are wiped after each reload",
          "The server's SSL certificate becomes publicly downloadable"
        ],
        correctAnswer: 1,
        explanation: "In 0-RTT, the client sends application data alongside the initial ClientHello using a previously cached session key. Because no handshake occurs to verify freshness, an attacker capturing the raw packets can replay the early data to the server. For this reason, 0-RTT must only be used for idempotent requests (GET) and never for state-mutating actions (POST)."
      }
    ]
  }
];
