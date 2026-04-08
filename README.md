# Smart Spend Tracker 💰

A modern, privacy-first personal finance management application built with React. Track your income and expenses, categorize transactions, set budgets, and reach your wealth goals—all with 100% local processing. Your financial data never leaves your device.

## Features ✨

- **📊 Smart Dashboard**: Real-time financial insights with budget telemetry, expense mapping, and wealth goal projections
- **🧠 AI-Powered Categorization**: Automatically categorizes transactions using intelligent keyword mapping
- **📈 Anomaly Detection**: Real-time alerts for unusual spending patterns and budget overruns
- **📄 Multi-Format Import**: Parse bank statements from CSV, PDF, and DOCX files
- **💾 Local-First Storage**: All data stored locally using IndexedDB for complete privacy
- **🌙 Dark Mode**: Comfortable viewing in any lighting condition
- **📱 Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **⚡ Recurring Transactions**: Set up automatic monthly entries for recurring expenses
- **💾 Data Export**: Backup and restore your financial data anytime

## Tech Stack 🛠️

- **Frontend**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **State Management**: React Context API + useReducer
- **Storage**: IndexedDB
- **File Parsing**: PapaParse, PDF.js, Mammoth

## Getting Started 🚀

### Prerequisites
- Node.js 18+ and npm 9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bharath506879/smart-spend-tracker.git
cd smart-spend-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure 📁

```
smart-spend-tracker/
├── src/
│   ├── App.jsx           # Main React component
│   └── index.jsx         # React DOM entry point
│   └── index.css         # Global styles
├── public/
│   └── index.html        # HTML entry point
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── netlify.toml          # Netlify deployment config
└── README.md             # This file
```

## Usage Guide 💡

1. **Set Your Financial Goals**: Configure your monthly budget limit and all-time savings target on first launch
2. **Add Transactions**: Manually add income and expense records with categories and notes
3. **Import Bank Statements**: Upload bank statements to auto-import and categorize transactions
4. **Monitor Dashboard**: Track real-time spending patterns, budget status, and wealth progress
5. **Export Data**: Backup your data as JSON or CSV anytime

## Key Algorithms 🧮

### Safe Daily Spend Calculator
Dynamically calculates your daily spending limit based on remaining budget and days left in the month:
```
Safe Daily Spend = (Monthly Budget - Already Spent) ÷ Remaining Days
```

### Anomaly Detection
Triggers warnings when:
- A single transaction exceeds 30% of monthly budget
- A category accounts for more than 40% of total spending

### Wealth Goal Projection
Estimates when you'll reach your savings target:
```
Months to Goal = Remaining Goal Amount ÷ Average Monthly Net Profit
```

## Deployment 🌐

This app is optimized for deployment on **Netlify**:

```bash
npm run build
```

The `netlify.toml` file handles all configuration. Simply connect your GitHub repository to Netlify for automatic deployments.

### Environment Variables
No API keys or secrets required! This is a fully client-side application.

## Privacy & Security 🔒

- **100% Local Processing**: Every calculation happens in your browser
- **No Backend Servers**: Your data never touches any external server
- **No Telemetry**: We don't collect or track your usage
- **IndexedDB Storage**: Browser-native encrypted local storage
- **HTTPS Ready**: Safe for use on any HTTPS-enabled server

## Browser Compatibility 🌐

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing 🤝

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License 📜

This project is licensed under the MIT License - see the LICENSE file for details.

## Analytics & Insights 📊

The app includes intelligent features for financial analysis:

- **Weekly Spending Trends**: Compares this week's spending vs. last week
- **Category Breakdown**: Visual donut chart of expense distribution
- **Spending Velocity**: Real-time burn rate and month-end projection
- **Sentiment Tracking**: Mark purchases as "worth it" or "regret" for behavior analysis
- **Metadata Enrichment**: Auto-attach notes from transaction descriptions

## Troubleshooting 🔧

### Data Not Persisting?
- Clear your browser's cached data and try again
- Check if IndexedDB is enabled in browser settings

### Import Not Working?
- Ensure your file format matches (CSV, PDF, or DOCX)
- Verify that your bank statement contains Date and Description columns

### Build Errors?
```bash
rm -rf node_modules
npm install
npm run build
```

## Roadmap 🎯

- [ ] Multi-user support with encryption
- [ ] Cloud sync (optional, encrypted)
- [ ] Advanced reporting and tax categorization
- [ ] Custom chart and visualization options
- [ ] Goal-based budget recommendations
- [ ] Spending behavior AI
- [ ] Mobile apps (iOS/Android)

## Support 💬

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainer.

---

Built with ❤️ by [Bharath](https://github.com/bharath506879)

**Get started managing your finances today!** 🚀
