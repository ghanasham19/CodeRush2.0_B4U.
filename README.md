# CodeRush 2.0 | Team Project Repository

## Project Information

* **Team Name:** B4U
* **Project Title:** EvidenceHub AI
* **Track/Theme:** Tracks 4 (Agentic Payment applications)

---

## Project Description

**EvidenceHub AI** is a decentralized, two-sided research marketplace that revolutionizes how proprietary research and data are monetized and consumed. Using a pay-per-insight (*x402 protocol*) model, EvidenceHub AI allows publishers to monetize valuable research PDFs without exposing the entire raw document, while researchers can purchase micro-targeted, verified answers directly on-chain without buying full subscriptions.

### How It Works:
* **The Publisher Flow (Supply Side):**
  * Connects via **Lute Wallet**, using their 58-character Algorand address as their sovereign identity.
  * Uploads proprietary research PDFs and creates specific "Insight Questions" with attached micro-transaction prices in ALGO.
  * Off-chain document metadata is stored securely in Firebase, while the raw PDF text remains protected from public access.

* **The Researcher Flow (Demand Side):**
  * Connects via **Lute Wallet** and browses the marketplace dashboard.
  * Previewing a document keeps the IP safe while displaying available purchasable insights.
  * Clicking **Unlock** triggers an Algorand micro-transaction signed seamlessly through Lute.
  * Once confirmed on TestNet, Google Gemini acts as an impartial forensic escrow agent to extract, verify, and cite the precise answer directly from the hidden PDF.

---

## Technical Stack

* **Frontend:** React (built with Vite), Tailwind CSS (split-screen UI layout), react-markdown (executive-level report formatting)
* **Backend:** Node.js, Express (PDF processing, Base64 encoding, Gemini API routing)
* **Database:** Firebase (Firestore) for off-chain metadata (titles, pricing, publisher IDs, user roles)
* **Web3 & Blockchain:** Algorand TestNet, algosdk, Lute Connect (wallet-as-identity, non-custodial peer-to-peer settlement)
* **Portfolio & Multichain Analytics:** Zerion API & Zerion CLI (for real-time wallet portfolio tracking, asset intelligence, and transaction history verification)
* **Tools/APIs:** Google Gemini (gemini-flash-latest forensic extraction engine with strict citation & anti-hallucination prompts)

---

## Key Features & Architecture Highlights

1. **Pay-Per-Insight (x402 Protocol):** Eliminates subscriptions. Researchers pay microALGOs only for the exact insight they require.
2. **Peer-to-Peer Settlement:** Zero platform custody. Funds flow directly from Researcher to Publisher on the Algorand blockchain.
3. **Forensic AI Agent:** Powered by gemini-flash-latest. Features strict system prompts to prevent hallucinations and enforce verifiable page-level citations.
4. **Zerion Integration:** Leverages **Zerion API** and **Zerion CLI** to enable comprehensive portfolio tracking, cross-chain asset analytics, and wallet transaction inspection directly within the developer ecosystem.

---

## Setup and Installation
Backend Setup:

Bash
cd backend
npm install
Create a .env file in the /backend directory:

Code snippet
PORT=5000
GEMINI_API_KEY=your_gemini_key_here
Start the backend server:

Bash
npm run dev
Frontend Setup:
Open a new terminal window:

Bash
cd frontend
npm install
Create a .env file in the /frontend directory with your Firebase configuration.
Start the React application:

Bash
npm run dev

Provide instructions on how to run your project locally:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-repo/evidencehub-ai.git](https://github.com/your-repo/evidencehub-ai.git)
   cd evidencehub-ai
