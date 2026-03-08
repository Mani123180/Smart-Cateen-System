# 🧠 Smart Canteen System: Comprehensive Project Report

This document serves as the formal theoretical report and operational manual for the Smart Canteen Management System.

---

## 📖 1. Project Abstract & Theoretical Basis

### Introduction
The Smart Canteen System is a digitized ecological solution designed to streamline the food ordering process in educational or corporate environments. Traditionally, canteen operations suffer from manual errors, long queues, and inefficient payment handling. This project addresses these bottlenecks by implementing a **Full-Stack Event-Driven Architecture**.

### Theoretical Framework
1.  **Client-Server Model**: The application follows a separation of concerns principle. The **Frontend** (Client) handles high-fidelity UI rendering and state management, while the **Backend** (Server) governs the business logic, data persistence, and security authentication.
2.  **RESTful API Principles**: Communication between the UI and the Server is handled via stateless HTTP methods (GET, POST, PUT, DELETE), ensuring predictable and reliable data exchange.
3.  **Real-Time Synchronization**: Using **WebSockets (Socket.io)**, the system achieves bi-directional communication, allowing the kitchen staff to receive orders instantly without manual polling.

---
`
## 🏗️ 2. Functional Module Analysis (Theory Mode)

### A. Authentication & User Security
*   **Principle**: The system employs **Cryptographic Hashing** using the Bcrypt algorithm with a cost factor of 10. Passwords are never stored as plain text, ensuring data privacy even in the event of a database breach.
*   **Authorization**: Upon successful login, the server issues a **JSON Web Token (JWT)**. This token act as a digital signature, allowing the user to access protected routes based on their role (Student vs Admin).

### B. Virtual Wallet & Transaction Logic
*   **Theory**: The system replaces physical cash with a **Digital Ledger**. Every transaction is an atomic operation:
    1.  Balance Verification.
    2.  Order Validation.
    3.  Deduction and Record Update.
*   **Integrity**: The backend enforces strict checks to prevent "Double Spending" or negative balances.

### C. Resource & Inventory Management
*   **Working Principle**: The database tracks item stock levels dynamically. When an order is placed, the inventory is automatically decremented. If an item hits zero stock, the Frontend dynamically disables the "Add to Cart" functionality via conditional rendering.

---

## 🔄 3. Key Logic Flows (The Step-by-Step Cycle)

### � The Ordering Life Cycle
1.  **Selection**: The user interacts with the `Menu` component, populating a local React State (Cart).
2.  **Validation**: A pre-flight check happens on the client-side to ensure sufficient balance.
3.  **Commit**: An API call triggers the backend to verify the request against the current database state.
4.  **Notification**: A Socket.io event `order_received` is broadcasted.
5.  **Fulfillment**: Staff updates the status, triggering a state update on the student's dashboard.

---

## 🔘 4. Detailed Button-by-Button Flow (Interaction Guide)

### 🖱️ Student Dashboard
| Button Name | Action (What you click) | Reaction (What happens in Background) |
| :--- | :--- | :--- |
| **"Add to Cart"** | Clicks on a food item card. | Dispatches `ADD_ITEM` to CartContext. UI icon updates to show quantity. |
| **"Checkout/Pay"** | Clicks Pay in the Cart page. | Calls `orderService.createOrder()`. Deducts money from `users.json` and adds record to `orders.json`. |
| **"Forgot Password"** | Clicks link on login card. | Switches `isForgot` state to TRUE. UI changes to the Reset Password form instantly. |
| **"Update Password"** | Clicks button after entering new pass. | Calls `authService.resetPassword()`. Backend hashes the new password and overwrites the old one in `users.json`. |

### 🖱️ Staff (Distributor) Dashboard
| Button Name | Action (What you click) | Reaction (What happens in Background) |
| :--- | :--- | :--- |
| **"Mark as Served"** | Clicks button on a pending order card. | `orderService.updateStatus()` is called. Backend updates `status: "Served"`. |
| **"Add New Product"** | Clicks + button in Stock page. | Opens modal. `productService.addProduct()` saves new item to `products.json`. |
| **"Update Stock"** | Changes quantity number. | Backend modifies the `stock` value for that specific ID in `products.json`. |

### 🖱️ Admin Dashboard
| Button Name | Action (What you click) | Reaction (What happens in Background) |
| :--- | :--- | :--- |
| **"Manage Users"** | Clicks User Management link. | Fetches all users from `/api/users`. |
| **"Close Canteen"** | Toggles a timing switch. | Updates `settings.json`. Frontend then hides the "Add to Cart" buttons for students. |

---

## 🗺️ 5. System Flow Diagram (Phases)

### Phase 1: Authentication Phase
`Landing` -> `Login` -> `Auth Service` -> `JWT Issue` -> `Redirect`.

### Phase 2: Transaction Phase
`Dashboard` -> `Menu` -> `State Change` -> `API Validation` -> `DB Update` -> `Order Success`.

### Phase 3: Notification Phase
`Backend Event` -> `Socket Broadcast` -> `Distributor UI Refresh`.

---

## 📊 6. Data Relationship Diagram (JSON Schema)

*   **Users**: Storage for identity and financial balance.
*   **Products**: Storage for menu items and live stock counts.
*   **Orders**: Transaction history linking Users to Products.
*   **Settings**: System-wide configurations (Timings, availability).

---

## 🛠️ 7. Technical Stack Details

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 | High-performance stateful UI |
| **Styling** | Vanilla CSS | Custom Glassmorphism design system |
| **Security** | JWT & Bcrypt | Encryption and Session safety |
| **Real-time** | Socket.io | Instant bi-directional communication |

---
*Generated for Smart Canteen Final Project Report 2026.*

