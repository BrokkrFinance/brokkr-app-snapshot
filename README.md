# Brokkr Snapshot

## Overview

The `SnapshotService` is a core component of the Brokkr Snapshot application, responsible for aggregating and validating snapshot data across multiple investment portfolios. It interfaces with various database and contract services to compile comprehensive snapshots, ensuring data integrity through robust Quality Assurance (QA) checks.

## Features

- **Comprehensive Snapshot Aggregation:** Gathers snapshot data from diverse portfolio types including Token Index, Token Based, Arrakis Vault, and DCA.
- **Quality Assurance Checks:** Validates snapshot data against predefined thresholds and consistency checks to ensure accuracy.
- **Modular Design:** Leverages specialized services for database interactions and contract communications, promoting maintainability and scalability.
- **Efficient Data Handling:** Utilizes asynchronous operations and optimized querying to handle large datasets effectively.

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-repo/brokkr-snapshot.git
   cd brokkr-snapshot
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and configure the necessary environment variables as per the `.env.example` template.

4. **Run the Application:**
   ```bash
   npm run start
   ```

## Service Details

### Main Methods

- **`getTotalSnapshotWithChecks(snapshotBlock: number, usdThreshold: number)`**
  
  Aggregates snapshots across all portfolio types and performs QA checks to validate the data.
  
  **Returns:**
  ```typescript
  {
    snapshot: SnapshotType[];
    isValid: boolean;
    errors: string[];
  }
  ```

### Dependencies

The `SnapshotService` interacts with several other services to perform its operations:

- **Database Services:**
  - `TokenIndexDbService`
  - `TokenBasedDbService`
  - `VaultDbService`
  - `DcaDbService`

- **Contract Services:**
  - `TokenIndexContractService`
  - `TokenBasedContractService`
  - `ArrakisContractsService`
  - `DcaContractService`

- **Configuration and QA:**
  - `BrokkrSnapshotConfigService`
  - `QaService`

## Code Structure

```
src/
├── config/
│   └── brokkr-snapshot-config.service.ts
├── contract-connectors/
│   ├── arrakis-contracts/
│   ├── dca-contract/
│   ├── token-based-contract/
│   └── token-index-contract/
├── db/
│   ├── dca-db/
│   ├── token-based-db/
│   ├── token-index-db/
│   └── vault-db/
├── shared/
│   ├── constants.ts
│   └── models/
│       └── ISnapshot.ts
├── snapshot/
│   ├── snapshot.service.ts
│   └── snapshot.controller.ts
└── qa/
    └── qa.service.ts
```

- **`config/`**: Configuration services and modules.
- **`contract-connectors/`**: Services that interact with blockchain contracts.
- **`db/`**: Database interaction services and models.
- **`shared/`**: Shared constants and models used across the application.
- **`snapshot/`**: The main SnapshotService and its controller.
- **`qa/`**: Quality Assurance services for validating snapshot data.