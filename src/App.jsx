import React, { useState, useEffect, useMemo, useCallback, createContext, useContext, useReducer, useRef } from 'react';
import { 
  Home, PieChart as PieChartIcon, List, Settings, 
  Moon, Sun, Plus, Trash2, Edit2, ArrowUpRight, 
  ArrowDownRight, DollarSign, Wallet, AlertCircle, 
  Search, CheckCircle, TrendingUp, TrendingDown,
  RefreshCw, X, Inbox, ChevronDown, CheckCircle2, AlertTriangle, Zap, CalendarDays,
  Utensils, Car, Film, HeartPulse, ShoppingBag, Package, Briefcase, Laptop, PlusCircle, 
  Target, ArrowRight, Lightbulb, Activity, ShieldCheck, Radar, Cpu, Fingerprint, Info,
  Undo2, Download, Upload, Smartphone, Sparkles, Telescope, ThumbsUp, ThumbsDown, FileSpreadsheet,
  UploadCloud, FileText, File as FileIcon, Check, Loader2, Play, FileUp, ArrowLeft
} from 'lucide-react';

// ==========================================
// 📁 /utils/constants.js
// ==========================================

const CATEGORIES = {
  INCOME: ['Salary', 'Freelance', 'Investments', 'Other Income'],
  EXPENSE: ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other Expense']
};

const COLORS = {
  Housing: '#ef4444', Food: '#f97316', Transportation: '#eab308',
  Utilities: '#22c55e', Entertainment: '#3b82f6', Healthcare: '#a855f7',
  Shopping: '#ec4899', 'Other Expense': '#64748b',
  Salary: '#22c55e', Freelance: '#3b82f6', Investments: '#8b5cf6', 'Other Income': '#64748b'
};

const CATEGORY_ICONS = {
  'Housing': Home, 'Food': Utensils, 'Transportation': Car, 'Utilities': Zap,
  'Entertainment': Film, 'Healthcare': HeartPulse, 'Shopping': ShoppingBag,
  'Other Expense': Package, 'Salary': Briefcase, 'Freelance': Laptop,
  'Investments': TrendingUp, 'Other Income': PlusCircle
};

// ==========================================
// 📁 /utils/helpers.js
// ==========================================

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  if (typeof dateString !== 'string') return String(dateString);
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  const localDate = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(localDate);
};

const toLocalISODate = (date) => {
  if (!date || isNaN(date)) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

const loadExternalScript = (src, globalVar) => new Promise((resolve, reject) => {
  if (window[globalVar]) return resolve(window[globalVar]);
  const script = document.createElement('script');
  script.src = src;
  script.onload = () => resolve(window[globalVar]);
  script.onerror = reject;
  document.head.appendChild(script);
});

// ==========================================
// 📁 /utils/categoryMapper.js
// ==========================================

const KEYWORD_MAP = {
  'swiggy': 'Food', 'zomato': 'Food', 'mcdonalds': 'Food', 'starbucks': 'Food', 'grocery': 'Food', 'supermarket': 'Food', 'dominos': 'Food', 'restaurant': 'Food',
  'uber': 'Transportation', 'ola': 'Transportation', 'petrol': 'Transportation', 'fuel': 'Transportation', 'shell': 'Transportation', 'irctc': 'Transportation', 'metro': 'Transportation',
  'amazon': 'Shopping', 'flipkart': 'Shopping', 'myntra': 'Shopping', 'zara': 'Shopping', 'apparel': 'Shopping',
  'netflix': 'Entertainment', 'spotify': 'Entertainment', 'movie': 'Entertainment', 'cinema': 'Entertainment', 'prime video': 'Entertainment', 'steam': 'Entertainment',
  'hospital': 'Healthcare', 'pharmacy': 'Healthcare', 'clinic': 'Healthcare', 'apollo': 'Healthcare', 'medplus': 'Healthcare',
  'electricity': 'Utilities', 'water': 'Utilities', 'wifi': 'Utilities', 'broadband': 'Utilities', 'airtel': 'Utilities', 'jio': 'Utilities', 'bescom': 'Utilities',
  'rent': 'Housing', 'maintenance': 'Housing',
  'salary': 'Salary', 'payroll': 'Salary', 'neft': 'Other Income', 'imps': 'Other Income', 'upi': 'Other Expense'
};

const smartCategorize = (description, amount, type) => {
  if (!description) return type === 'income' ? 'Other Income' : 'Other Expense';
  const descLower = String(description).toLowerCase();
  
  for (const [key, cat] of Object.entries(KEYWORD_MAP)) {
    if (descLower.includes(key)) return cat;
  }
  return type === 'income' ? 'Other Income' : 'Other Expense';
};

// ==========================================
// 📁 /services/fileParser.js
// ==========================================

const parseCSV = async (file) => {
  const Papa = await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js', 'Papa');
  
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const headers = results.meta.fields.map(h => h.toLowerCase().trim());
          const dateCol = results.meta.fields[headers.findIndex(x => x.includes('date'))];
          const descCol = results.meta.fields[headers.findIndex(x => x.includes('description') || x.includes('particulars') || x.includes('narration') || x.includes('details'))];
          const debitCol = results.meta.fields[headers.findIndex(x => x.includes('debit') || x.includes('withdrawal'))];
          const creditCol = results.meta.fields[headers.findIndex(x => x.includes('credit') || x.includes('deposit'))];
          const amtCol = results.meta.fields[headers.findIndex(x => x === 'amount' || x === 'amount(inr)' || x === 'value')];

          if (!dateCol || !descCol) throw new Error("Could not map required CSV columns (Date, Description)");

          const transactions = results.data.map(row => {
            const dateStr = row[dateCol];
            const desc = row[descCol];
            let amount = 0;
            let type = 'expense';

            if (debitCol && row[debitCol]) {
              amount = parseFloat(row[debitCol].replace(/,/g, ''));
              type = 'expense';
            } else if (creditCol && row[creditCol]) {
              amount = parseFloat(row[creditCol].replace(/,/g, ''));
              type = 'income';
            } else if (amtCol && row[amtCol]) {
              const rawAmt = parseFloat(row[amtCol].replace(/,/g, ''));
              amount = Math.abs(rawAmt);
              type = rawAmt < 0 ? 'expense' : 'income'; 
            }

            if (isNaN(amount) || amount === 0) return null;

            let formattedDate = toLocalISODate(new Date());
            const d = new Date(dateStr);
            if (!isNaN(d)) formattedDate = toLocalISODate(d);
            else {
               const parts = dateStr.split(/[\/\-]/);
               if (parts.length === 3) formattedDate = toLocalISODate(new Date(`${parts[2]}-${parts[1]}-${parts[0]}`));
            }

            return {
              id: generateId(), date: formattedDate, description: desc, amount: amount, type: type,
              category: smartCategorize(desc, amount, type), note: 'Auto-imported from CSV', isRecurring: false, sentiment: 'neutral'
            };
          }).filter(Boolean);

          resolve(transactions);
        } catch (e) { reject(e); }
      },
      error: (e) => reject(e)
    });
  });
};

const extractTransactionsFromText = (text) => {
  const lines = text.split('\n');
  const txns = [];
  let previousBalance = null;
  const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+[a-zA-Z]{3,}\s+\d{2,4})\b/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('opening balance') || trimmed.toLowerCase().includes('brought forward')) {
      const nums = trimmed.match(/-?[\d,]+\.\d{2}/g);
      if (nums && nums.length > 0) previousBalance = parseFloat(nums[nums.length - 1].replace(/,/g, ''));
    }

    const dateMatch = trimmed.match(dateRegex);
    if (dateMatch) {
      const numberMatches = trimmed.match(/-?[\d,]+\.\d{2}/g);
      if (numberMatches && numberMatches.length >= 1) {
        const amounts = numberMatches.map(a => parseFloat(a.replace(/,/g, '')));
        let balance = amounts.length > 1 ? amounts[amounts.length - 1] : null;
        let extractedAmount = amounts.length > 1 ? amounts[amounts.length - 2] : amounts[0];
        let type = 'expense'; 

        if (previousBalance !== null && balance !== null) {
          const diff = parseFloat((balance - previousBalance).toFixed(2));
          if (diff > 0) { type = 'income'; extractedAmount = Math.abs(diff); } 
          else if (diff < 0) { type = 'expense'; extractedAmount = Math.abs(diff); }
        } else {
           if (trimmed.toLowerCase().includes(' cr')) type = 'income';
           if (trimmed.toLowerCase().includes(' dr')) type = 'expense';
        }

        if (balance !== null) previousBalance = balance;
        if (isNaN(extractedAmount) || extractedAmount === 0) continue;

        const dateStr = dateMatch[1];
        let desc = trimmed.replace(dateMatch[0], '');
        numberMatches.forEach(num => { desc = desc.replace(num, ''); });
        desc = desc.replace(/\b(Cr|Dr)\b/ig, '').replace(/^[\d\s]+/, '').replace(/\s{2,}/g, ' ').trim();

        let formattedDate = toLocalISODate(new Date());
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length === 3 && parts[2].length === 4 && !isNaN(parts[1])) {
           formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else {
           const d = new Date(dateStr);
           if (!isNaN(d)) formattedDate = toLocalISODate(d);
        }

        txns.push({
          id: generateId(), date: formattedDate, description: desc || 'Bank Transaction',
          amount: extractedAmount, type: type, category: smartCategorize(desc, extractedAmount, type),
          note: 'Auto-imported', isRecurring: false, sentiment: 'neutral'
        });
      }
    }
  }
  return txns;
};

const parsePDF = async (file) => {
  const pdfjsLib = await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js', 'pdfjsLib');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const rowMap = new Map();
          textContent.items.forEach(item => {
            const y = Math.round(item.transform[5] / 5) * 5; 
            if (!rowMap.has(y)) rowMap.set(y, []);
            rowMap.get(y).push(item);
          });
          const sortedY = Array.from(rowMap.keys()).sort((a, b) => b - a);
          sortedY.forEach(y => {
            const items = rowMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
            const rowText = items.map(item => item.str.trim()).filter(Boolean).join(' ');
            fullText += rowText + '\n';
          });
        }
        const txns = extractTransactionsFromText(fullText);
        if (txns.length === 0) throw new Error("No transactions found in PDF structure.");
        resolve(txns);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(new Error("Failed to read PDF file"));
    reader.readAsArrayBuffer(file);
  });
};

const parseDOCX = async (file) => {
  const mammoth = await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result;
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const txns = extractTransactionsFromText(result.value);
        if (txns.length === 0) throw new Error("No transactions found in DOCX structure.");
        resolve(txns);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(new Error("Failed to read DOCX file"));
    reader.readAsArrayBuffer(file);
  });
};

const parseFile = async (file) => {
  const type = file.name.split('.').pop().toLowerCase();
  switch (type) {
    case 'csv': return await parseCSV(file);
    case 'pdf': return await parsePDF(file);
    case 'docx': return await parseDOCX(file);
    default: throw new Error(`Unsupported file format: ${type}`);
  }
};

// ==========================================
// 📁 /hooks/useStatementParser.js
// ==========================================

const useStatementParser = () => {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [error, setError] = useState(null);

  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsParsing(true);
    setError(null);
    setParsedData([]);

    try {
      const txns = await parseFile(uploadedFile);
      setParsedData(txns);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to process statement. Ensure it is a valid bank format.');
    } finally {
      setIsParsing(false);
    }
  };

  const clearData = () => { setFile(null); setParsedData([]); setError(null); };
  const updateParsedRow = (id, updates) => { setParsedData(prev => prev.map(row => row.id === id ? { ...row, ...updates } : row)); };
  const deleteParsedRow = (id) => { setParsedData(prev => prev.filter(row => row.id !== id)); };

  return { file, isParsing, parsedData, error, handleFileUpload, clearData, updateParsedRow, deleteParsedRow };
};

// ==========================================
// 📁 /services/IndexedDBService.js
// ==========================================

const DB_NAME = 'SpendSmart_DB';
const DB_VERSION = 1; 
const STORE_NAME = 'app_state';

const IDBService = {
  init: async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  get: async (key) => {
    const db = await IDBService.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  set: async (key, value) => {
    const db = await IDBService.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  clearAll: async () => {
    const db = await IDBService.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// ==========================================
// 📁 /store/GlobalStore.js 
// ==========================================

const initialState = {
  isInitialized: false, isAuthenticated: false, transactions: [],
  budget: 50000, savingsGoal: 200000, baselineDate: '', darkMode: false,
  lastRecurringCheck: new Date().getMonth(), toasts: [], deletedCache: null 
};

const StoreContext = createContext();

const storeReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_STATE': return { ...state, ...action.payload, isInitialized: true };
    case 'SET_AUTH': return { ...state, isAuthenticated: action.payload };
    case 'SET_PREFS': return { ...state, budget: action.payload.budget, savingsGoal: action.payload.savingsGoal, baselineDate: action.payload.baselineDate };
    case 'SET_THEME': return { ...state, darkMode: action.payload };
    case 'ADD_TXN': return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TXN': return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TXN': 
      const txnToDelete = state.transactions.find(t => t.id === action.payload);
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload), deletedCache: txnToDelete };
    case 'UNDO_DELETE':
      if (!state.deletedCache) return state;
      return { ...state, transactions: [...state.transactions, state.deletedCache], deletedCache: null };
    case 'CLEAR_DELETED_CACHE': return { ...state, deletedCache: null };
    case 'SET_TRANSACTIONS': return { ...state, transactions: action.payload };
    case 'ADD_BULK_TXNS': return { ...state, transactions: [...state.transactions, ...action.payload] }; 
    case 'UPDATE_RECURRING_CHECK': return { ...state, lastRecurringCheck: action.payload };
    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'PURGE_DATA': return { ...initialState, isInitialized: true, darkMode: state.darkMode };
    default: return state;
  }
};

const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await IDBService.get('app_state');
        if (savedData) dispatch({ type: 'INIT_STATE', payload: savedData });
        else dispatch({ type: 'INIT_STATE', payload: {} });
      } catch (e) {
        console.error("Failed to initialize storage", e);
        dispatch({ type: 'INIT_STATE', payload: {} });
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (state.isInitialized) {
      const stateToSave = {
        isAuthenticated: state.isAuthenticated, transactions: state.transactions,
        budget: state.budget, savingsGoal: state.savingsGoal, baselineDate: state.baselineDate,
        darkMode: state.darkMode, lastRecurringCheck: state.lastRecurringCheck
      };
      IDBService.set('app_state', stateToSave).catch(console.error);
    }
  }, [state]);

  const actions = useMemo(() => ({
    setAuth: (status) => dispatch({ type: 'SET_AUTH', payload: status }),
    setPrefs: (budget, savingsGoal, baselineDate) => dispatch({ type: 'SET_PREFS', payload: { budget, savingsGoal, baselineDate } }),
    setTheme: (isDark) => dispatch({ type: 'SET_THEME', payload: isDark }),
    addTxn: (txn) => dispatch({ type: 'ADD_TXN', payload: txn }),
    updateTxn: (txn) => dispatch({ type: 'UPDATE_TXN', payload: txn }),
    deleteTxn: (id) => dispatch({ type: 'DELETE_TXN', payload: id }),
    undoDelete: () => dispatch({ type: 'UNDO_DELETE' }),
    clearDeletedCache: () => dispatch({ type: 'CLEAR_DELETED_CACHE' }),
    setTransactions: (txns) => dispatch({ type: 'SET_TRANSACTIONS', payload: txns }),
    addBulkTxns: (txns) => dispatch({ type: 'ADD_BULK_TXNS', payload: txns }), 
    updateRecurringCheck: (month) => dispatch({ type: 'UPDATE_RECURRING_CHECK', payload: month }),
    purgeData: async () => { await IDBService.clearAll(); dispatch({ type: 'PURGE_DATA' }); },
    addToast: (message, type = 'success', action = null) => {
      const id = generateId();
      dispatch({ type: 'ADD_TOAST', payload: { id, message, type, action } });
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
    },
    removeToast: (id) => dispatch({ type: 'REMOVE_TOAST', payload: id })
  }), []);

  return <StoreContext.Provider value={{ state, actions }}>{children}</StoreContext.Provider>;
};

const useStore = () => useContext(StoreContext);

// ==========================================
// 📁 /components/ErrorBoundary.jsx
// ==========================================

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("ErrorBoundary caught an error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">System Fault Detected</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">The application encountered a critical rendering error. Your data is safe.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">Reload Interface</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 📁 /hooks/useCustomHooks.js
// ==========================================

function useCountUp(end, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(end * easeOutQuart);
      if (progress < 1) window.requestAnimationFrame(step);
      else setCount(end);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
}

function useValueFlash(value, reverseLogic = false) {
  const [flashClass, setFlashClass] = useState('');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== undefined && value !== prevValueRef.current) {
      const isIncrease = value > prevValueRef.current;
      let color = isIncrease ? 'green' : 'red';
      if (reverseLogic) color = isIncrease ? 'red' : 'green';
      
      setFlashClass('');
      const t1 = setTimeout(() => setFlashClass(`animate-flash-${color}`), 10);
      const t2 = setTimeout(() => setFlashClass(''), 1200);

      prevValueRef.current = value;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    prevValueRef.current = value;
  }, [value, reverseLogic]);

  return flashClass;
}

function useInsights(transactions) {
  return useMemo(() => {
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    
    const thisWeek = transactions.filter(t => t.type === 'expense' && (now - new Date(t.date)) <= 7 * msInDay).reduce((s, t) => s + t.amount, 0);
    const lastWeek = transactions.filter(t => t.type === 'expense' && (now - new Date(t.date)) > 7 * msInDay && (now - new Date(t.date)) <= 14 * msInDay).reduce((s, t) => s + t.amount, 0);
    
    const weeklyChange = lastWeek === 0 ? 0 : ((thisWeek - lastWeek) / lastWeek) * 100;
    const weeklyStatus = weeklyChange > 0 ? 'higher' : 'lower';
    
    const catTotals = transactions.filter(t => t.type === 'expense' && (now - new Date(t.date)) <= 30 * msInDay).reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    const topCategory = Object.keys(catTotals).sort((a,b) => catTotals[b] - catTotals[a])[0] || 'None';

    return { thisWeek, lastWeek, weeklyChange, weeklyStatus, topCategory };
  }, [transactions]);
}

// ==========================================
// 📁 /components/ui/Primitives.jsx
// ==========================================

const AnimatedCurrency = ({ value, className = "" }) => {
  const animatedValue = useCountUp(value);
  return (
    <span className={className}>
      <span className="text-[0.75em] opacity-80 mr-0.5">₹</span>
      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(animatedValue)}
    </span>
  );
};

const Card = ({ children, className = '', hover = false, ...props }) => (
  <div className={`bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 relative overflow-hidden ${hover ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5' : ''} ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:scale-95";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:ring-blue-500",
    secondary: "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:ring-slate-200 dark:focus:ring-slate-600",
    danger: "bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-transparent focus:ring-rose-500",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = ({ label, className = '', ...props }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    {label && <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{label}</label>}
    <input 
      className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm ${className}`} 
      {...props} 
    />
  </div>
);

const Select = ({ label, options, className = '', icon: Icon, ...props }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    {label && <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />}
      <select 
        className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-8 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer shadow-sm ${className}`} 
        {...props}
      >
        {options.map(opt => <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{String(opt.label)}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={16} />
    </div>
  </div>
);

const ToastContainer = () => {
  const { state, actions } = useStore();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {state.toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white pointer-events-auto transition-all duration-300 animate-in slide-in-from-right-8 fade-in zoom-in-95 border ${t.type === 'success' ? 'bg-slate-900 border-slate-800' : t.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-blue-600 border-blue-500'}`}>
          {t.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0"/> : t.type === 'error' ? <AlertTriangle size={18} className="shrink-0"/> : <Sparkles size={18} className="shrink-0"/>}
          <span className="text-sm font-semibold tracking-wide flex-1">{String(t.message)}</span>
          {t.action && (
            <button onClick={() => { t.action.onClick(); actions.removeToast(t.id); }} className="ml-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, confirmText = "Confirm", onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-700">
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-800">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 📁 /components/charts/Charts.jsx
// ==========================================

const ProgressBar = ({ current, max, colorClass = "bg-blue-500", height = "h-2" }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100)) || 0;
  return (
    <div className={`w-full ${height} bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner`}>
      <div className={`h-full ${colorClass} transition-all duration-1000 ease-out relative overflow-hidden rounded-full`} style={{ width: `${percentage}%` }}>
        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
      </div>
    </div>
  );
};

const DonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return (
    <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-full w-40 mx-auto border border-dashed border-slate-200 dark:border-slate-700">
      <PieChartIcon size={20} className="mb-2 opacity-50 text-slate-400" />
      <span className="text-xs font-medium">No data</span>
    </div>
  );

  let currentAngle = 0;
  const segments = data.map(item => {
    const angle = (item.value / total) * 360;
    const segment = `${item.color} ${currentAngle}deg ${currentAngle + angle}deg`;
    currentAngle += angle;
    return segment;
  });

  return (
    <div className="relative w-40 h-40 mx-auto group">
      <div className="w-full h-full rounded-full transition-transform duration-500 shadow-sm" style={{ background: `conic-gradient(${segments.join(', ')})` }} />
      <div className="absolute inset-0 m-auto w-28 h-28 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center flex-col shadow-inner border-[3px] border-white dark:border-slate-800">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total</span>
        <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[90px]" title={formatCurrency(total)}>
          <AnimatedCurrency value={total} />
        </span>
      </div>
    </div>
  );
};

// ==========================================
// 📁 /components/modals/TransactionModal.jsx
// ==========================================

const TransactionModal = ({ isOpen, onClose, initialData, selectedMonthStr, incomeCategories, expenseCategories }) => {
  const { actions } = useStore();
  
  const getDefaultDate = useCallback(() => {
    if (selectedMonthStr) {
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      if (selectedMonthStr === currentMonthStr) return toLocalISODate(today);
      return `${selectedMonthStr}-01`;
    }
    return toLocalISODate(new Date());
  }, [selectedMonthStr]);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [formData, setFormData] = useState(initialData || { type: 'income', amount: '', category: incomeCategories[0], date: getDefaultDate(), note: '', isRecurring: false, sentiment: 'neutral' });

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setIsAddingCustom(false);
    if (initialData) setFormData({ ...initialData, sentiment: initialData.sentiment || 'neutral' });
    else setFormData({ type: 'income', amount: '', category: incomeCategories[0], date: getDefaultDate(), note: '', isRecurring: false, sentiment: 'neutral' });
  }, [initialData, isOpen, getDefaultDate, incomeCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount) || !formData.category.trim()) return;
    
    const txnPayload = { ...formData, id: formData.id || generateId(), amount: parseFloat(formData.amount), category: formData.category.trim() };
    
    if (initialData) {
      actions.updateTxn(txnPayload);
      actions.addToast('Record updated successfully.');
    } else {
      actions.addTxn(txnPayload);
      actions.addToast('Record added successfully.');
    }
    onClose();
  };

  const activeCategories = formData.type === 'income' ? incomeCategories : expenseCategories;
  const SelectedIcon = CATEGORY_ICONS[formData.category] || Package;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${formData.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="flex justify-between items-center mb-6 mt-1">
          <h2 className="text-xl font-bold tracking-tight">{initialData ? 'Edit Record' : 'New Transaction'}</h2>
          <Button variant="ghost" className="!p-2 rounded-full" onClick={onClose} aria-label="Close modal"><X size={18} /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl shadow-inner border border-transparent">
            <button type="button" className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => { setFormData({ ...formData, type: 'income', category: incomeCategories[0] }); setIsAddingCustom(false); }}>Income</button>
            <button type="button" className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => { setFormData({ ...formData, type: 'expense', category: expenseCategories[0] }); setIsAddingCustom(false); }}>Expense</button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Input label="Amount (₹)" type="number" step="1" min="0" required autoFocus value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0" className="text-lg font-bold w-full" />
            <Input label="Date" type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full" />
          </div>

          {isAddingCustom ? (
            <div className="flex flex-col space-y-1.5 w-full animate-in fade-in zoom-in-95 duration-200">
               <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Custom Category</label>
               <div className="flex items-center gap-2">
                 <input className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm" placeholder="Category name" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} autoFocus required />
                 <button type="button" onClick={() => { setIsAddingCustom(false); setFormData({...formData, category: activeCategories[0]}); }} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-500" aria-label="Clear custom category" title="Clear category"><X size={18}/></button>
               </div>
            </div>
          ) : (
            <Select label="Category" icon={SelectedIcon} value={formData.category} onChange={e => { if (e.target.value === '__new__') { setIsAddingCustom(true); setFormData({ ...formData, category: '' }); } else setFormData({ ...formData, category: e.target.value }); }} options={[...activeCategories.map(c => ({ value: c, label: c })), { value: '__new__', label: '+ Add Custom Category' }]} />
          )}

          {formData.type === 'expense' && (
            <div className="flex flex-col space-y-1.5 w-full">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Purchase Sentiment</label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl shadow-inner border border-transparent">
                <button type="button" className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${formData.sentiment === 'worth_it' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`} onClick={() => setFormData({ ...formData, sentiment: 'worth_it' })}><ThumbsUp size={14} className="mr-1.5"/> Worth it</button>
                <button type="button" className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${formData.sentiment === 'regret' ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`} onClick={() => setFormData({ ...formData, sentiment: 'regret' })}><ThumbsDown size={14} className="mr-1.5"/> Regret</button>
              </div>
            </div>
          )}

          <Input label="Note (Optional)" type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="What was this for?" />

          <div className="flex items-center pt-1 px-1">
            <input type="checkbox" id="recurring" checked={formData.isRecurring} onChange={e => setFormData({...formData, isRecurring: e.target.checked})} className="w-4 h-4 text-blue-600 bg-white border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 cursor-pointer transition-colors" />
            <label htmlFor="recurring" className="ml-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center cursor-pointer select-none">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Auto-add monthly
            </label>
          </div>

          <div className="pt-4 flex space-x-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1">{initialData ? 'Save Changes' : 'Add Transaction'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 📁 /views/LandingView.jsx
// ==========================================

const LandingView = () => {
  const { actions } = useStore();
  const [step, setStep] = useState('landing');
  
  const [budgetInput, setBudgetInput] = useState('50000');
  const [goalInput, setGoalInput] = useState('200000');
  const [dateInput, setDateInput] = useState(toLocalISODate(new Date()));

  const handleContinue = (e) => {
    e.preventDefault();
    actions.setPrefs(Number(budgetInput) || 50000, Number(goalInput) || 200000, dateInput);
    actions.setAuth(true);
    actions.addToast('Welcome to SpendSmart!');
  };

  if (step === 'onboarding') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300">
        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-8">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SpendSmart</span>
          </div>

          <Card className="shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Set Your Financial Baseline</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Let's personalize your dashboard by setting your initial targets.</p>
            </div>

            <form onSubmit={handleContinue} className="space-y-5">
              <Input label="Monthly Budget Limit (₹)" type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder="50000" min="0" required />
              <Input label="All-Time Savings Target (₹)" type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} placeholder="200000" min="0" required />
              <Input label="Baseline Tracking Start Date" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} required />
              
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="secondary" className="flex-1 w-full" onClick={() => setStep('landing')}>Back</Button>
                <Button type="submit" className="flex-1 w-full">Go to Dashboard</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SpendSmart</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Button onClick={() => setStep('onboarding')}>Get Started Free</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold mb-8 border border-blue-100 dark:border-blue-800/50 relative z-10">
          <Sparkles size={16} /> Now with Local On-Device Insights
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl relative z-10 text-slate-900 dark:text-white">
          Take full control of your <span className="text-blue-600 dark:text-blue-400">financial future.</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl relative z-10 px-4">
          SpendSmart is a modern personal finance tracker. Analyze your spending habits, set intelligent budgets, and effortlessly track your progress toward your wealth goals.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-auto px-4 sm:px-0">
          <Button className="!px-8 !py-4 text-base sm:text-lg w-full sm:w-auto" onClick={() => setStep('onboarding')}>Open Dashboard</Button>
        </div>

        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl w-full relative z-10 text-left px-4 sm:px-0">
           <Card>
             <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4"><PieChartIcon size={24}/></div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Smart Insights</h3>
             <p className="text-sm text-slate-600 dark:text-slate-400">Automatically categorizes your transactions and detects unusual spending spikes to keep your budget safe.</p>
           </Card>
           <Card>
             <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4"><Target size={24}/></div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Wealth Goals</h3>
             <p className="text-sm text-slate-600 dark:text-slate-400">Set an all-time savings target and our projection engine will map out exactly when you'll reach financial independence.</p>
           </Card>
           <Card>
             <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center mb-4"><Fingerprint size={24}/></div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">100% Private</h3>
             <p className="text-sm text-slate-600 dark:text-slate-400">Built with local-first processing principles. Your sensitive financial data is stored locally via IndexedDB.</p>
           </Card>
        </div>
      </main>
    </div>
  );
};

// ==========================================
// 📁 /views/DashboardView.jsx
// ==========================================

const DashboardView = ({ selectedMonthStr, setActiveTab, onOpenModal }) => {
  const { state, actions } = useStore();
  const { transactions, budget, savingsGoal } = state;

  const [yearStr, monthStr] = selectedMonthStr.split('-');
  const selectedYear = parseInt(yearStr, 10);
  const selectedMonth = parseInt(monthStr, 10) - 1;

  const [quickType, setQuickType] = useState('income');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState(CATEGORIES.INCOME[0]);
  const [isAddingQuickCustom, setIsAddingQuickCustom] = useState(false);

  const incomeCategories = useMemo(() => [...new Set([...CATEGORIES.INCOME, ...transactions.filter(t => t.type === 'income').map(t => t.category)])], [transactions]);
  const expenseCategories = useMemo(() => [...new Set([...CATEGORIES.EXPENSE, ...transactions.filter(t => t.type === 'expense').map(t => t.category)])], [transactions]);
  const activeQuickCategories = quickType === 'income' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (!isAddingQuickCustom && !activeQuickCategories.includes(quickCategory)) {
       setQuickCategory(activeQuickCategories[0] || '');
    }
  }, [quickType, activeQuickCategories, quickCategory, isAddingQuickCustom]);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);

  useEffect(() => { setTempBudget(budget); }, [budget]);

  const handleSaveCustomBudget = () => {
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val >= 0) actions.setPrefs(val, savingsGoal, state.baselineDate);
    else setTempBudget(budget);
    setIsEditingBudget(false);
  };

  const currentMonthTxns = useMemo(() => transactions.filter(t => (t.date || '').startsWith(selectedMonthStr)), [transactions, selectedMonthStr]);
  const income = currentMonthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = currentMonthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  const allTimeWealth = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  const wealthProgress = Math.min(100, Math.max(0, (allTimeWealth / savingsGoal) * 100));
  const remainingWealthGoal = Math.max(0, savingsGoal - allTimeWealth);
  const monthsToGoal = balance > 0 ? Math.ceil(remainingWealthGoal / balance) : 'Never';

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const currentDay = new Date().getMonth() === selectedMonth && new Date().getFullYear() === selectedYear ? new Date().getDate() : daysInMonth;
  const dailyAverage = expense / (currentDay || 1);
  const safeDailySpend = Math.max(0, (budget - expense) / (daysInMonth - currentDay + 1));
  const projectedMonthEndSpend = dailyAverage * daysInMonth;
  const isPacingOver = projectedMonthEndSpend > budget;

  const { weeklyChange, weeklyStatus } = useInsights(transactions);

  const anomaly = useMemo(() => {
    if (expense === 0) return null;
    
    const expensesByCat = currentMonthTxns.filter(t => t.type === 'expense').reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    const topCat = Object.keys(expensesByCat).sort((a,b) => expensesByCat[b] - expensesByCat[a])[0];
    
    if (topCat && budget > 0 && (expensesByCat[topCat] / budget) > 0.40) {
       return { type: 'concentration', category: topCat, amount: expensesByCat[topCat], msg: `High spending concentration detected in one category.`};
    }

    const largestTxn = currentMonthTxns.filter(t => t.type === 'expense').sort((a,b) => b.amount - a.amount)[0];
    if (largestTxn && budget > 0 && (largestTxn.amount / budget) > 0.30) {
       return { type: 'spike', category: largestTxn.category, amount: largestTxn.amount, msg: `Unusual single outflow detected.`};
    }
    
    return null;
  }, [currentMonthTxns, budget, expense]);

  const expensesByCategory = currentMonthTxns.filter(t => t.type === 'expense').reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
  const donutData = Object.entries(expensesByCategory).map(([name, value]) => ({ name: String(name), value, color: COLORS[name] || COLORS['Other Expense'] })).sort((a, b) => b.value - a.value);

  const budgetUsedPct = (expense / budget) * 100;
  const isOverBudget = expense > budget;

  const balanceFlashClass = useValueFlash(balance);
  const incomeFlashClass = useValueFlash(income);
  const expenseFlashClass = useValueFlash(expense, true); 
  const dailyAverageFlashClass = useValueFlash(dailyAverage, true);

  const handleQuickAdd = useCallback(() => {
    if (!quickAmount || isNaN(quickAmount) || !quickCategory || !String(quickCategory).trim()) return;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() === selectedMonth;
    const dateToSave = isCurrentMonth ? toLocalISODate(today) : `${selectedMonthStr}-01`;

    actions.addTxn({
      type: quickType, amount: parseFloat(quickAmount), category: String(quickCategory).trim(), date: dateToSave, note: 'Quick add', isRecurring: false, sentiment: 'neutral', id: generateId()
    });
    actions.addToast('Quick entry added.');
    
    setQuickAmount(''); 
    setIsAddingQuickCustom(false);
    setQuickCategory(activeQuickCategories[0] || '');
  }, [quickAmount, quickCategory, quickType, selectedYear, selectedMonth, selectedMonthStr, actions, activeQuickCategories]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card hover className={`!bg-gradient-to-br !from-indigo-600 !via-purple-600 !to-violet-800 !text-white border-none shadow-purple-500/30 shadow-lg ${balanceFlashClass}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-purple-100 uppercase tracking-wider">Net Balance</h3>
            <div className="p-1.5 bg-white/20 text-white rounded-lg"><Wallet size={16} /></div>
          </div>
          <p className="text-2xl lg:text-xl xl:text-2xl font-black !text-white tracking-tight break-words break-all mt-1">
            <AnimatedCurrency value={balance} />
          </p>
        </Card>
        
        <Card hover className={`border-t-4 border-t-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 ${incomeFlashClass}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Income</h3>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-lg"><ArrowDownRight size={16} /></div>
          </div>
          <p className="text-2xl lg:text-xl xl:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words break-all mt-1">
            <AnimatedCurrency value={income} />
          </p>
        </Card>

        <Card hover className={`border-t-4 border-t-rose-500 bg-rose-50/50 dark:bg-rose-900/20 ${expenseFlashClass}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</h3>
            <div className="p-1.5 bg-rose-100 dark:bg-rose-800/50 text-rose-600 dark:text-rose-400 rounded-lg"><ArrowUpRight size={16} /></div>
          </div>
          <div className="flex flex-wrap items-end justify-between mt-1 gap-y-1 gap-x-2">
             <p className="text-2xl lg:text-xl xl:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words break-all">
               <AnimatedCurrency value={expense} />
             </p>
             {weeklyChange !== 0 && (
               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${weeklyStatus === 'lower' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`} title="vs Last 7 Days">
                 {weeklyStatus === 'lower' ? '-' : '+'}{Math.abs(weeklyChange).toFixed(1)}% 7d
               </span>
             )}
          </div>
        </Card>

        <Card hover className={`border-t-4 border-t-amber-500 bg-amber-50/50 dark:bg-amber-900/20 ${dailyAverageFlashClass}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              Safe Spend <Lightbulb size={12} className="ml-1 text-amber-500 dark:text-amber-400"/>
            </h3>
            <div className="p-1.5 bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400 rounded-lg"><Activity size={16} /></div>
          </div>
          <div className="flex flex-wrap items-baseline justify-between mt-1 gap-x-2 gap-y-1">
             <p className="text-2xl lg:text-xl xl:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words break-all">
               <AnimatedCurrency value={safeDailySpend} />
             </p>
             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest shrink-0">/ day</p>
          </div>
        </Card>
      </div>

      {/* 2. MAIN BENTO GRID (8/4 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Data Heavy (Spans 8/12 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Budget Telemetry */}
          <Card className={`flex flex-col ${isOverBudget ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20' : ''}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
                <Telescope className="mr-2 text-blue-500" size={16}/> Budget Telemetry
              </h3>
              {isOverBudget && <span className="flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded shadow-sm border border-rose-200 dark:border-rose-800"><AlertCircle size={12} className="mr-1"/> Exceeded</span>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center h-full">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Burn Rate (Spent)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white truncate">{formatCurrency(expense)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center h-full">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Target Limit</p>
                <div className="flex items-center gap-1 w-full">
                  {isEditingBudget ? (
                    <div className="flex items-center w-full">
                      <input type="number" value={tempBudget} onChange={(e) => setTempBudget(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomBudget()} className="w-full min-w-[60px] px-2 py-1 text-sm font-bold rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none border border-blue-500 focus:ring-2 focus:ring-blue-500/50" autoFocus />
                      <button onClick={handleSaveCustomBudget} className="ml-2 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"><CheckCircle2 size={18}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group cursor-pointer w-full" onClick={() => setIsEditingBudget(true)} title="Edit Limit">
                      <span className="text-lg font-black text-slate-900 dark:text-white truncate">{formatCurrency(budget)}</span>
                      <Edit2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center h-full">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Month-End Proj.</p>
                <p className={`text-lg font-black truncate ${isPacingOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(projectedMonthEndSpend)}</p>
              </div>
            </div>

            <div className="space-y-2 mt-auto">
              <ProgressBar current={expense} max={budget} height="h-2.5" colorClass={isOverBudget ? 'bg-rose-500' : budgetUsedPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'} />
              <div className="flex justify-between items-center text-xs font-bold">
                <span className={isPacingOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
                  {isPacingOver ? `Overpacing by ${formatCurrency(projectedMonthEndSpend - budget)}` : `Pacing safely.`}
                </span>
                <span className={isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>
                  {budgetUsedPct.toFixed(1)}% Consumed
                </span>
              </div>
            </div>
          </Card>

          {/* 50/50 Sub-Grid for Charts & Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Expense Mapping */}
            <Card className="flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Expense Map</h3>
              <div className="flex-1 flex flex-col justify-center">
                <DonutChart data={donutData} />
                <div className="mt-6 space-y-3 max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
                  {donutData.slice(0, 4).map(item => {
                    const CatIcon = CATEGORY_ICONS[item.name] || Package;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs group">
                        <div className="flex items-center min-w-0">
                          <div className="w-6 h-6 rounded flex items-center justify-center mr-3 shadow-sm shrink-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" style={{ color: item.color }}>
                            <CatIcon size={12} strokeWidth={2.5}/>
                          </div>
                          <span className="text-slate-600 dark:text-slate-300 font-bold truncate">{String(item.name)}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white pl-2 shrink-0">{formatCurrency(item.value)}</span>
                      </div>
                    )
                  })}
                  {donutData.length === 0 && <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-semibold opacity-70 mt-4">Awaiting Data</div>}
                </div>
              </div>
            </Card>

            {/* Wealth Goal */}
            <Card className="flex flex-col h-full bg-gradient-to-br from-slate-50 dark:from-slate-800/80 to-white dark:to-slate-800 border-emerald-100 dark:border-emerald-900/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
                  <Target className="mr-2 text-emerald-500" size={16}/> Wealth Target
                </h3>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800/50">
                  {wealthProgress.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Accumulated</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white truncate">
                    <AnimatedCurrency value={Math.max(0, allTimeWealth)} />
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                     <span>Progress</span>
                     <span className="text-slate-700 dark:text-slate-300">{formatCurrency(savingsGoal)} Goal</span>
                  </div>
                  <ProgressBar current={Math.max(0, allTimeWealth)} max={savingsGoal} colorClass="bg-emerald-500" height="h-2.5" />
                </div>
                
                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-3 flex items-center justify-between border border-slate-200 dark:border-slate-700 mt-auto">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Sparkles size={14}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projection</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {allTimeWealth >= savingsGoal ? 'Mastered! 🎉' : balance <= 0 ? 'Stalled' : `${String(monthsToGoal)} Mo to Goal`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* Recent History */}
          <Card className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity</h3>
              <Button variant="ghost" onClick={() => setActiveTab('history')} className="!text-xs !py-1.5 !px-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                View All <ArrowRight size={14} className="ml-1"/>
              </Button>
            </div>
            <div className="space-y-1 -mx-2">
              {currentMonthTxns.slice(0).reverse().slice(0, 4).map(txn => {
                const CatIcon = CATEGORY_ICONS[txn.category] || Package;
                return (
                <div key={txn.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group cursor-pointer flex-wrap gap-2">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${txn.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                      <CatIcon size={16} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{String(txn.category || 'Unknown')}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{formatDate(txn.date)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-auto">
                    <span className={`text-base font-black tracking-tight ${txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                  </div>
                </div>
              )})}
              {currentMonthTxns.length === 0 && (
                 <div className="py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl m-2">No activity logged this month.</div>
              )}
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN: Actions & Tools (Spans 4/12 columns, Sticky) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
          
          {/* Quick Add */}
          <Card className={`border-2 ${quickType === 'income' ? 'border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-rose-100 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20'} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
                <Zap className={`mr-1.5 ${quickType === 'income' ? 'text-emerald-500' : 'text-rose-500'}`} size={16}/> Quick Entry
              </h3>
              <div className="flex p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <button onClick={() => setQuickType('income')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${quickType === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}> In </button>
                <button onClick={() => setQuickType('expense')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${quickType === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}> Out </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                <input type="number" placeholder="Amount..." value={quickAmount} onChange={e => setQuickAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()} className={`w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 outline-none font-bold text-base shadow-sm transition-all ${quickType === 'income' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-rose-500 focus:border-rose-500'}`} />
              </div>
              
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 w-full">
                {isAddingQuickCustom ? (
                  <div className={`flex flex-1 items-center gap-1 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 transition-all overflow-hidden ${quickType === 'income' ? 'focus-within:ring-emerald-500' : 'focus-within:ring-rose-500'}`}>
                    <input type="text" className="w-full pl-3 py-2 text-sm font-bold bg-transparent text-slate-900 dark:text-white outline-none" placeholder="Category" value={quickCategory} onChange={e => setQuickCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()} autoFocus />
                    <button type="button" onClick={() => { setIsAddingQuickCustom(false); setQuickCategory(activeQuickCategories[0]); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" aria-label="Clear custom category" title="Clear category"><X size={14}/></button>
                  </div>
                ) : (
                  <Select options={[...activeQuickCategories.map(c => ({label: String(c), value: String(c)})), { label: '+ Custom', value: '__new__' }]} value={quickCategory} onChange={e => { if (e.target.value === '__new__') { setIsAddingQuickCustom(true); setQuickCategory(''); } else { setQuickCategory(e.target.value); } }} className={`!py-3 text-sm font-bold flex-1 bg-white dark:bg-slate-900/50 shadow-sm ${quickType === 'income' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-rose-500 focus:border-rose-500'}`} />
                )}
                <Button onClick={handleQuickAdd} className={`!py-3 px-4 shadow-sm shrink-0 rounded-xl w-full sm:w-auto lg:w-full xl:w-auto ${quickType === 'income' ? '!bg-emerald-600 hover:!bg-emerald-700 focus:!ring-emerald-500' : '!bg-rose-600 hover:!bg-rose-700 focus:!ring-rose-500'}`}>
                  <Plus size={18} strokeWidth={3}/>
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Import Dropzone Widget */}
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors" onClick={() => setActiveTab('import')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileUp size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Import Statement</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload CSV or PDF to parse.</p>
              </div>
              <ChevronDown className="ml-auto text-slate-400 -rotate-90" size={16}/>
            </div>
          </Card>

          {/* Anomaly Radar */}
          <Card className="relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-5 text-slate-900 dark:text-white pointer-events-none">
              <Radar size={120} />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
                <Radar className="mr-2 text-slate-500 dark:text-slate-400" size={16}/> Intelligence
              </h3>
              <span className="flex items-center text-[8px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                <Cpu size={8} className="mr-1" /> On-Device
              </span>
            </div>
            <div className="relative z-10">
              {anomaly ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/30 rounded-xl border border-rose-200 dark:border-rose-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-md"><AlertTriangle size={14}/></div>
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">Anomaly Warning</h4>
                  </div>
                  <p className="text-xs font-medium text-rose-700 dark:text-rose-400 leading-relaxed mb-3">{String(anomaly.msg)}</p>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900/80 p-2.5 rounded-lg shadow-sm border border-rose-100 dark:border-rose-800">
                     <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{String(anomaly.category || 'Unknown')}</span>
                     <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 pl-2">{formatCurrency(anomaly.amount)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-emerald-900/10 rounded-xl border border-slate-200 dark:border-emerald-800/30">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg shrink-0">
                    <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Behavior Normal</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">No unusual spending spikes.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 📁 /views/HistoryView.jsx
// ==========================================

const HistoryView = ({ transactions, onEdit, onDelete, incomeCategories, expenseCategories }) => {
  const { actions } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCat, setFilterCat] = useState('all');

  const filteredTxns = useMemo(() => {
    return transactions.filter(t => {
      const note = String(t.note || '');
      const category = String(t.category || '');
      const searchLower = String(searchTerm).toLowerCase();
      
      const matchSearch = note.toLowerCase().includes(searchLower) || category.toLowerCase().includes(searchLower);
      const matchType = filterType === 'all' || t.type === filterType;
      const matchCat = filterCat === 'all' || t.category === filterCat;
      return matchSearch && matchType && matchCat;
    }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [transactions, searchTerm, filterType, filterCat]);

  const allCategories = [...new Set([...incomeCategories, ...expenseCategories])];

  const handleDeleteWithUndo = (id) => {
    actions.deleteTxn(id);
    actions.addToast('Transaction removed.', 'error', { label: 'Undo', onClick: () => actions.undoDelete() });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="flex flex-col md:flex-row gap-4 items-center sticky top-4 z-20 shadow-sm border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl">
        <div className="relative w-full md:flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input 
            type="text" placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 text-sm font-medium"
          />
        </div>
        <div className="grid grid-cols-2 md:flex w-full md:w-auto gap-3">
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} options={[{value: 'all', label: 'All Types'}, {value: 'income', label: 'Income'}, {value: 'expense', label: 'Expense'}]} className="w-full md:w-32" />
          <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} options={[{value: 'all', label: 'All Categories'}, ...allCategories.map(c => ({value: String(c), label: String(c)}))]} className="w-full md:w-40" />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden shadow-sm border-slate-200 dark:border-slate-700">
        {filteredTxns.length > 0 ? (
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-sm">
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Note</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTxns.map(txn => {
                  const CatIcon = CATEGORY_ICONS[txn.category] || Package;
                  return (
                  <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors duration-200 group">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-200">
                      {formatDate(txn.date)}
                      {txn.isRecurring && <RefreshCw size={12} className="inline ml-1.5 text-blue-400 animate-spin-slow" title="Recurring" />}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-1.5 rounded-md text-xs font-bold tracking-wide shadow-sm border
                        ${txn.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                        <CatIcon size={12} className="mr-1.5 opacity-70"/> {String(txn.category || 'Unknown')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[150px] sm:max-w-[200px] truncate">
                      {String(txn.note || '-')}
                    </td>
                    <td className={`px-5 py-4 text-right whitespace-nowrap text-base font-black tracking-tight ${txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {txn.type === 'expense' && (
                          <div className="flex items-center gap-1 mr-3 border-r border-slate-200 dark:border-slate-700 pr-3">
                            <button onClick={() => onEdit({...txn, sentiment: txn.sentiment === 'worth_it' ? 'neutral' : 'worth_it'})} className={`p-1.5 rounded-lg transition-colors ${txn.sentiment === 'worth_it' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} aria-label="Mark as worth it" title="Worth it"><ThumbsUp size={14}/></button>
                            <button onClick={() => onEdit({...txn, sentiment: txn.sentiment === 'regret' ? 'neutral' : 'regret'})} className={`p-1.5 rounded-lg transition-colors ${txn.sentiment === 'regret' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} aria-label="Mark as regret" title="Regret"><ThumbsDown size={14}/></button>
                          </div>
                        )}
                        <button onClick={() => onEdit(txn)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all" aria-label="Edit transaction" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteWithUndo(txn.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all ml-1" aria-label="Delete transaction" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50 dark:bg-slate-800/50">
            <Search className="text-slate-300 dark:text-slate-600 mb-4" size={40}/>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Match Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Try adjusting your search or filters.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

// ==========================================
// 📁 /views/StatementUploadView.jsx
// ==========================================

const StatementUploadView = () => {
  const { actions, state } = useStore();
  const { file, isParsing, parsedData, error, handleFileUpload, clearData, updateParsedRow, deleteParsedRow } = useStatementParser();
  const [dragActive, setDragActive] = useState(false);

  const allCategories = [...new Set([...CATEGORIES.INCOME, ...CATEGORIES.EXPENSE, ...state.transactions.map(t => t.category)])];

  const onDragEvent = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave" || e.type === "drop") setDragActive(false);
  };

  const onDrop = (e) => {
    onDragEvent(e);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
  };

  const confirmImport = () => {
    if (parsedData.length === 0) return;
    actions.addBulkTxns(parsedData);
    actions.addToast(`Successfully imported ${parsedData.length} transactions.`);
    clearData();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <UploadCloud size={24} strokeWidth={2.5}/>
            </div>
            Statement Upload
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Automatically extract and categorize transactions from bank statements.</p>
        </div>
      </div>

      {!file && (
        <Card className="flex flex-col items-center justify-center p-10 md:p-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group relative" onDragEnter={onDragEvent} onDragOver={onDragEvent} onDragLeave={onDragEvent} onDrop={onDrop}>
          <div className={`absolute inset-0 transition-colors ${dragActive ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-500' : ''}`} />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform duration-300">
               <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Drag & Drop Statement</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
               Supports bank statements in <strong>CSV, PDF, or DOCX</strong> format. Processed 100% locally.
            </p>
            <label className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer transition-all active:scale-95">
              Browse Files
              <input type="file" className="hidden" accept=".csv, .pdf, .docx" onChange={onFileChange} />
            </label>
          </div>
        </Card>
      )}

      {isParsing && (
        <Card className="flex flex-col items-center justify-center p-16 text-center">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Document</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Extracting transactions and running smart categorization algorithms...</p>
        </Card>
      )}

      {error && !isParsing && (
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-center p-10">
           <AlertTriangle className="text-rose-500 mx-auto mb-4" size={40} />
           <h3 className="text-lg font-bold text-rose-900 dark:text-rose-300 mb-2">Processing Error</h3>
           <p className="text-sm text-rose-600 dark:text-rose-400 mb-6 max-w-md mx-auto">{error}</p>
           <Button variant="danger" onClick={clearData}>Try Another File</Button>
        </Card>
      )}

      {parsedData.length > 0 && !isParsing && (
        <Card className="p-0 overflow-hidden flex flex-col border-emerald-200 dark:border-emerald-800 shadow-md">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50/50 dark:bg-emerald-900/10">
             <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                 <CheckCircle className="text-emerald-500 mr-2" size={20} /> Preview Extracted Data
               </h3>
               <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">Review and modify categories before importing <strong>{parsedData.length} records</strong>.</p>
             </div>
             <div className="flex items-center gap-3">
               <Button variant="ghost" onClick={clearData} className="!text-slate-500 dark:!text-slate-400 hover:!text-rose-600 dark:hover:!text-rose-400">Cancel</Button>
               <Button onClick={confirmImport} className="!bg-emerald-600 hover:!bg-emerald-700 focus:!ring-emerald-500">
                 Confirm & Import
               </Button>
             </div>
          </div>
          
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-sm">
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Category (Auto)</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                  <th className="px-5 py-4 text-center">Discard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {parsedData.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-200">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 max-w-[200px] sm:max-w-[250px] truncate" title={txn.description}>
                      {txn.description}
                    </td>
                    <td className="px-5 py-4">
                      <select 
                        value={txn.category} 
                        onChange={(e) => updateParsedRow(txn.id, { category: e.target.value })}
                        className={`text-xs font-bold px-3 py-1.5 rounded-md border outline-none shadow-sm transition-colors cursor-pointer ${
                          txn.category.includes('Other') 
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                            : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {allCategories.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{c}</option>)}
                      </select>
                    </td>
                    <td className={`px-5 py-4 text-right whitespace-nowrap text-base font-black tracking-tight ${txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <button onClick={() => deleteParsedRow(txn.id)} className="p-2 text-slate-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all opacity-100 sm:opacity-0 group-hover:opacity-100" aria-label="Discard imported transaction" title="Discard">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==========================================
// 📁 /views/SettingsView.jsx
// ==========================================

const SettingsView = ({ budget, savingsGoal }) => {
  const { state, actions } = useStore();
  const [localBudget, setLocalBudget] = useState(budget);
  const [localGoal, setLocalGoal] = useState(savingsGoal);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSave = () => {
    actions.setPrefs(Number(localBudget), Number(localGoal), state.baselineDate);
    actions.addToast('System Preferences Saved Successfully');
  };

  const handleClearData = async () => {
    await actions.purgeData();
    actions.addToast('Local Data Purged.', 'error');
    setTimeout(() => window.location.reload(), 500);
  };

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(state.transactions);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `spendsmart_backup_${toLocalISODate(new Date())}.json`;
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    actions.addToast('Data backup exported successfully.');
  }, [state.transactions, actions]);

  const handleExportCSV = useCallback(() => {
    const { transactions, budget, savingsGoal } = state;
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    let csv = "FINANCIAL SUMMARY\n";
    csv += `Total Income,Rs. ${totalIncome}\n`;
    csv += `Total Expenses,Rs. ${totalExpense}\n`;
    csv += `Net Balance,Rs. ${netBalance}\n`;
    csv += `Monthly Budget Limit,Rs. ${budget}\n`;
    csv += `All-Time Wealth Goal,Rs. ${savingsGoal}\n\n`;

    csv += "TRANSACTION HISTORY\n";
    csv += "Date,Type,Category,Amount (Rs.),Note,Sentiment,Recurring\n";

    const sortedTxns = [...transactions].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    sortedTxns.forEach(t => {
      csv += `${t.date || ''},${(t.type || '').toUpperCase()},"${String(t.category || '').replace(/"/g, '""')}",${t.amount || 0},"${String(t.note || '').replace(/"/g, '""')}",${t.sentiment || 'N/A'},${t.isRecurring ? 'Yes' : 'No'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SpendSmart_Report_${toLocalISODate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    actions.addToast('Excel/CSV export generated successfully!');
  }, [state, actions]);

  const handleImport = useCallback((event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const importedTransactions = JSON.parse(e.target.result);
        if (Array.isArray(importedTransactions)) {
           actions.setTransactions(importedTransactions);
           actions.addToast('Data restored successfully!');
        } else throw new Error("Invalid file format");
      } catch (error) {
        actions.addToast('Failed to import data.', 'error');
      }
    };
  }, [actions]);

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center border-b border-slate-100 dark:border-slate-700 pb-4 tracking-tight">
          <Settings className="mr-2 text-blue-500" size={20}/> System Config
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Monthly Budget Target (₹)" type="number" value={localBudget} onChange={(e) => setLocalBudget(e.target.value)} className="font-bold text-lg text-slate-900 dark:text-white" min="0" step="1000" />
            <Input label="All-Time Wealth Goal (₹)" type="number" value={localGoal} onChange={(e) => setLocalGoal(e.target.value)} className="font-bold text-lg text-slate-900 dark:text-white" min="0" step="5000" />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>Deploy Configurations</Button>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <Fingerprint size={20} className="text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
            <div>
               <h4 className="text-sm font-bold text-slate-900 dark:text-white">Local Federated Processing</h4>
               <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                 To ensure privacy compliance, this module utilizes browser-based IndexedDB storage. Telemetry never leaves your device.
               </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
             <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Portability & Backup</h4>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               <Button variant="secondary" className="flex-1 !px-2" onClick={handleExportCSV}>
                 <FileSpreadsheet size={18} className="mr-2"/> Export Excel
               </Button>
               <Button variant="secondary" className="flex-1 !px-2" onClick={handleExport}>
                 <Download size={18} className="mr-2"/> JSON Backup
               </Button>
               <label className="flex-1 flex items-center justify-center px-2 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all active:scale-95">
                 <Upload size={18} className="mr-2"/> Import Data
                 <input type="file" accept=".json" className="hidden" onChange={handleImport} />
               </label>
             </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-5 mt-8">
             <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400 mb-2">Deterministic Unlearning</h4>
             <p className="text-sm text-rose-600 dark:text-rose-400 mb-4 max-w-md">
                Purging your local IndexedDB cache triggers an irreversible deletion of your history. Certified unlearning.
             </p>
             <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>Purge Local History</Button>
          </div>
        </div>
      </Card>

      <ConfirmModal isOpen={isConfirmOpen} title="Execute Protocol?" message="This will permanently delete all transactions. Cannot be undone." confirmText="Confirm Purge" onConfirm={handleClearData} onCancel={() => setIsConfirmOpen(false)} />
    </div>
  );
};

// ==========================================
// 📁 /views/AboutView.jsx
// ==========================================

const AboutView = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Info size={24} strokeWidth={2.5}/>
            </div>
            System Intelligence
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Documentation on the core algorithms powering your financial dashboard.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col h-full border-t-4 border-t-blue-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Radar size={24}/></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-100 dark:border-blue-800/50 flex items-center gap-1"><Cpu size={12} /> Local Processing</span>
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Anomaly Radar</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed flex-1">
            Scans your ledger entirely on-device to detect massive, out-of-the-ordinary outflows or category concentration before they compound.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400"><strong className="text-slate-800 dark:text-slate-200">Trigger Threshold:</strong> Activates when a single transaction consumes <strong>&gt; 30%</strong> of budget limit, or a category accounts for <strong>&gt; 40%</strong>.</p>
          </div>
        </Card>

        <Card className="flex flex-col h-full border-t-4 border-t-amber-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl"><Lightbulb size={24}/></div>
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Safe Daily Spend</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed flex-1">
            A real-time pacing guardrail. Calculates exactly how much you can spend today—and every day for the rest of the month—without breaking limits.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
             <code className="text-xs block bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-mono text-center shadow-sm">(Budget - Spent) ÷ Remaining Days</code>
          </div>
        </Card>

        <Card className="flex flex-col h-full border-t-4 border-t-blue-400">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-xl"><Telescope size={24}/></div>
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Budget Telemetry</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed flex-1">
            Projects future outcomes by analyzing your current spending momentum, allowing proactive course correction rather than just reviewing history.
          </p>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div><span><strong className="text-slate-800 dark:text-slate-200">Burn Rate:</strong> Average amount spent per day.</span></li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div><span><strong className="text-slate-800 dark:text-slate-200">Projection:</strong> Burn Rate multiplied by total days in month.</span></li>
          </ul>
        </Card>

        <Card className="flex flex-col h-full border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><Target size={24}/></div>
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Wealth Goal Engine</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed flex-1">
            Maps complete net wealth history against a target. Rewards aggressive saving by projecting exactly when you'll reach financial independence.
          </p>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div><span><strong className="text-slate-800 dark:text-slate-200">Accumulation:</strong> All-time income minus all-time expenses.</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
};


// ==========================================
// 📁 /App.jsx (Main Container)
// ==========================================

const AppContent = () => {
  const { state, actions } = useStore();
  const { isAuthenticated, transactions, budget, savingsGoal, darkMode } = state;
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const incomeCategories = useMemo(() => [...new Set([...CATEGORIES.INCOME, ...transactions.filter(t => t.type === 'income').map(t => t.category)])], [transactions]);
  const expenseCategories = useMemo(() => [...new Set([...CATEGORIES.EXPENSE, ...transactions.filter(t => t.type === 'expense').map(t => t.category)])], [transactions]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a'; 
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc'; 
    }
  }, [darkMode]);

  // Execute Auto-Recurring Engine
  useEffect(() => {
    if (!state.isInitialized || !isAuthenticated) return;

    const currentMonth = new Date().getMonth();
    if (state.lastRecurringCheck !== currentMonth) {
      const recurringTemplates = transactions.filter(t => t.isRecurring);
      
      if (recurringTemplates.length > 0) {
        const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const newTxns = [];
        
        const uniqueTemplates = Array.from(new Map(recurringTemplates.map(item => [item.category + item.amount + item.type, item])).values());

        uniqueTemplates.forEach(template => {
          const alreadyAddedThisMonth = transactions.some(t => 
            t.isRecurring && 
            t.category === template.category && 
            t.amount === template.amount && 
            t.type === template.type &&
            (t.date || '').startsWith(currentMonthStr)
          );
          
          if (!alreadyAddedThisMonth) {
            newTxns.push({
              ...template,
              id: generateId(),
              date: toLocalISODate(new Date()),
              note: template.note ? `${template.note} (Auto-recurring)` : 'Auto-recurring monthly',
            });
          }
        });

        if (newTxns.length > 0) {
          actions.addBulkTxns(newTxns);
          actions.addToast(`Auto-added ${newTxns.length} recurring transactions for this month.`, 'success');
        }
      }
      actions.updateRecurringCheck(currentMonth);
    }
  }, [state.isInitialized, isAuthenticated, state.lastRecurringCheck, transactions, actions]);

  const openEditModal = useCallback((txn) => {
    setEditingTxn(txn);
    setIsModalOpen(true);
  }, []);

  const confirmDelete = useCallback((id) => {
    actions.deleteTxn(id);
    actions.addToast('Transaction deleted.', 'error', { label: 'Undo', onClick: () => actions.undoDelete() });
    setDeleteConfirmId(null);
  }, [actions]);

  if (!state.isInitialized) {
     return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;
  }

  if (!isAuthenticated) return <LandingView />;

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChartIcon },
    { id: 'history', label: 'History', icon: List },
    { id: 'import', label: 'Import Data', icon: UploadCloud },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-700 ${darkMode ? 'dark bg-slate-900 selection:bg-blue-500/40' : 'bg-slate-50 selection:bg-blue-200'} text-slate-900`}>
      
      <ToastContainer />
      
      <div className="flex h-screen overflow-hidden relative z-10">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-colors z-20">
          <div className="p-6 flex items-center justify-between mt-2">
             <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400 relative">
               <div className="absolute -left-6 w-1.5 h-6 bg-blue-500 rounded-r-full"></div>
               <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">SpendSmart</span>
             </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1.5 mt-6">
           
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-bold group relative overflow-hidden ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}/>
                  <span className="tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 space-y-2">
            <button 
              aria-label="Toggle Theme"
              onClick={() => actions.setTheme(!darkMode)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-sm font-bold group"
            >
              <div className="flex items-center space-x-2">
                {darkMode ? <Sun size={16} className="group-hover:rotate-90 transition-transform duration-700"/> : <Moon size={16} className="group-hover:-rotate-12 transition-transform duration-300"/>}
                <span className="tracking-wide">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </button>
            <button 
              aria-label="Back to Home"
              onClick={() => actions.setAuth(false)}
              className="flex items-center space-x-2 w-full px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-sm font-bold group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="tracking-wide">Back to Home</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto relative scroll-smooth custom-scrollbar z-10">
          
          {/* Mobile Header */}
          <header className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm transition-colors">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">SpendSmart</span>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Toggle Theme" onClick={() => actions.setTheme(!darkMode)} className="p-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 rounded-lg border border-transparent dark:border-slate-600 transition-colors">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button aria-label="Back to Home" onClick={() => actions.setAuth(false)} className="p-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 rounded-lg border border-transparent dark:border-slate-600 transition-colors">
                <ArrowLeft size={18} />
              </button>
            </div>
          </header>

          <div className="px-5 md:px-8 pt-8 pb-6 w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 z-10">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white capitalize tracking-tight flex items-center">
              {activeTab.replace('-', ' ')}
            </h1>
            
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
              {activeTab === 'dashboard' && (
                <div className="relative w-full sm:w-auto group">
                   <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={16}/>
                   <input 
                     type="month" 
                     value={selectedMonthStr}
                     onChange={(e) => setSelectedMonthStr(e.target.value)}
                     className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none w-full cursor-pointer transition-colors"
                   />
                </div>
              )}

              {activeTab !== 'settings' && activeTab !== 'import' && activeTab !== 'about' && (
                <Button onClick={() => { setEditingTxn(null); setIsModalOpen(true); }} className="w-full sm:w-auto whitespace-nowrap shadow-sm">
                  <Plus size={18} className="mr-1.5" strokeWidth={3}/> Add Record
                </Button>
              )}
            </div>
          </div>

          <div className="px-5 md:px-8 pb-24 md:pb-8 w-full flex-1 max-w-[1600px] mx-auto">
            {activeTab === 'dashboard' && <DashboardView selectedMonthStr={selectedMonthStr} setActiveTab={setActiveTab} />}
            {activeTab === 'history' && <HistoryView transactions={transactions} onEdit={openEditModal} onDelete={setDeleteConfirmId} incomeCategories={incomeCategories} expenseCategories={expenseCategories} />}
            {activeTab === 'import' && <StatementUploadView />}
            {activeTab === 'settings' && <SettingsView budget={budget} savingsGoal={savingsGoal} />}
            {activeTab === 'about' && <AboutView />}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-2 py-2 flex justify-between items-center z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] transition-colors">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center p-2 transition-colors relative w-full ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {isActive && <div className="absolute -top-2 w-8 h-1 bg-blue-500 rounded-b-full"></div>}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`} />
                <span className={`text-[10px] mt-1 font-bold tracking-wider ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity absolute -bottom-1`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>

      <TransactionModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        initialData={editingTxn} selectedMonthStr={selectedMonthStr}
        incomeCategories={incomeCategories} expenseCategories={expenseCategories}
      />

      <ConfirmModal 
        isOpen={!!deleteConfirmId} title="Execute Purge?"
        message="Permanently remove this transaction from the history? This action cannot be reversed."
        confirmText="Confirm Purge" onConfirm={() => confirmDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-color: transparent; background-clip: padding-box; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; border-color: transparent; background-clip: padding-box;}
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        
        @keyframes flash-green {
          0% { box-shadow: inset 0 0 200px 200px rgba(16, 185, 129, 0.1), 0 0 0 2px rgba(16, 185, 129, 0.5); border-color: rgba(16,185,129,0.8); }
          100% { box-shadow: inset 0 0 0 0 rgba(16, 185, 129, 0), 0 0 0 0px rgba(16, 185, 129, 0); border-color: inherit; }
        }
        @keyframes flash-red {
          0% { box-shadow: inset 0 0 200px 200px rgba(244, 63, 94, 0.1), 0 0 0 2px rgba(244, 63, 94, 0.5); border-color: rgba(244,63,94,0.8); }
          100% { box-shadow: inset 0 0 0 0 rgba(244, 63, 94, 0), 0 0 0 0px rgba(244, 63, 94, 0); border-color: inherit; }
        }
        .animate-flash-green { animation: flash-green 1.2s ease-out; z-index: 10; position: relative; }
        .animate-flash-red { animation: flash-red 1.2s ease-out; z-index: 10; position: relative; }
        
        .animate-spin-slow { animation: spin 3s linear infinite; }
      `}} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ErrorBoundary>
  );
}