
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, Search, Home, Download, User as UserIcon, ArrowLeft, Loader2, Box, Circle, Gem, Layers, Grid, ChevronDown, ChevronRight, Heart, Check, Crown, CloudUpload, FileUp, X, Scale, Hash, Calendar, Ruler, Maximize2, SlidersHorizontal, TrendingUp, TrendingDown, DollarSign, Mail, Send, LogOut, KeyRound, Eye, EyeOff, Headset, MessageCircle, CreditCard, QrCode, Wallet, ShoppingCart, Building2, Sparkles, Zap, PartyPopper, Camera, Bell, CheckCircle2, Trophy } from 'lucide-react';
import { NeumorphButton, NeumorphCard, NeumorphInput } from './components/LayoutComponents';
import { MOCK_ITEMS, CATEGORIES } from './constants';
import { JewelryItem, ViewState } from './types';
import { searchJewelryWithAI } from './services/geminiService';
import { auth, db } from './firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

// --- Static Components Extracted for Performance ---

const NavIcon = React.memo(({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-gold' : 'text-gray-600 hover:text-gray-400'}`}>
    {icon}
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
    {active && <div className="w-1 h-1 bg-gold rounded-full absolute bottom-2" />}
  </button>
));

const SpecItem = React.memo(({ label, value, icon }: { label: string, value?: string, icon: React.ReactNode }) => {
  if (!value) return null;
  return (
    <div className="bg-surface rounded-xl p-3 shadow-neumorph flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium uppercase tracking-wide">
        {icon}<span>{label}</span>
      </div>
      <span className="text-gray-200 font-medium text-sm truncate" title={value}>{value}</span>
    </div>
  );
});

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert';
  read: boolean;
  date: string;
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('welcome');
  const [welcomeView, setWelcomeView] = useState<'main' | 'login' | 'register' | 'forgot-password'>('main');
  const [previousView, setPreviousView] = useState<ViewState>('discover');
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const [items, setItems] = useState<JewelryItem[]>(MOCK_ITEMS);
  const [selectedItem, setSelectedItem] = useState<JewelryItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Data synced with Firebase
  const [downloads, setDownloads] = useState<JewelryItem[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>('Prata'); 
  
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false); 
  
  // Custom customization states
  const [customRingSize, setCustomRingSize] = useState('');
  
  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Bem-vindo!', message: 'Explore nossa coleção e solicite seus arquivos STL.', type: 'info', read: false, date: 'Hoje' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Request STL States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  
  // Contact Modal State
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ name: string, price: string, type: 'plan' | 'item' } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix'>('credit');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Success/Celebration Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPlanName, setSuccessPlanName] = useState('');
  const [successType, setSuccessType] = useState<'plan' | 'item' | 'request' | 'register'>('plan');
  
  // Search Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterMaterial, setFilterMaterial] = useState('Todos');
  const [filterPrice, setFilterPrice] = useState('Todos');
  
  // Favorites State with LocalStorage
  const [favorites, setFavorites] = useState<JewelryItem[]>(() => {
    try {
      const saved = localStorage.getItem('favoriteItems'); 
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load favorites", e);
      return [];
    }
  });

  // Zoom State
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Navigation & Categorization state
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [listingTitle, setListingTitle] = useState<string>('');

  const [userName, setUserName] = useState('Visitante'); 
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regPhoto, setRegPhoto] = useState<File | null>(null);

  // Password Visibility States
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');

  // Mock Subscription State for Progress Bar
  const maxDownloads = 10;
  const usedDownloads = useMemo(() => 3 + downloads.length, [downloads]); 

  // --- Optimized Helper Functions (useCallback) ---

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      read: false,
      date: 'Agora'
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const sendToWhatsApp = useCallback((text: string) => {
    const phone = '5517991168394';
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(url, '_blank');
  }, []);

  const sendAutomaticEmail = useCallback(async (subject: string, body: string) => {
    // Placeholder for backend logic
    return true;
  }, []);

  // Firebase Auth & Firestore Sync Listener
  useEffect(() => {
    let unsubscribeFirestore: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserName(user.displayName || user.email?.split('@')[0] || 'Usuário');
        
        try {
          const userRef = doc(db, 'users', user.uid);
          unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setCurrentPlan(data.plan || null);
              setDownloads(data.downloads || []);
            } else {
              setDoc(userRef, {
                email: user.email,
                displayName: user.displayName,
                plan: null,
                downloads: [],
                createdAt: serverTimestamp()
              }, { merge: true }).catch(() => {}); // Silent catch for demo mode
            }
          }, (error) => {
            // Demo mode fallback on permission denied/api key issues
            console.debug("Firestore Unavailable (Demo Mode Active)");
          });
        } catch (e) {
          console.debug("Firestore Init Error (Demo Mode Active)");
        }

        if (view === 'welcome') {
           setView('discover');
        }
      } else {
        // Logged out
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [view]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const deleteNotification = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const toggleFavorite = useCallback((e: React.MouseEvent, item: JewelryItem) => {
    e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id);
      const newFavs = exists 
        ? prev.filter(f => f.id !== item.id) 
        : [...prev, item];
      localStorage.setItem('favoriteItems', JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  const openDetails = useCallback((item: JewelryItem, origin: ViewState = 'listing') => {
    setSelectedItem(item);
    setActiveImageIndex(0);
    setCustomRingSize(''); 
    setPreviousView(origin);
    setView('details');
  }, []);

  // Handler Optimizations
  const handleRequestClick = useCallback(() => {
    if (!selectedItem) return;

    if (!currentPlan) {
      addNotification("Assinatura Necessária", "Escolha um plano para solicitar arquivos STL.", "alert");
      setPaymentTarget({
        name: 'Plano Prata (Mensal)',
        price: 'R$ 14,90',
        type: 'plan'
      });
      setShowPaymentModal(true);
      return;
    }

    if (usedDownloads >= maxDownloads) {
      addNotification("Limite Atingido", "Você atingiu seu limite mensal. Faça um upgrade.", "alert");
      setPaymentTarget({
        name: 'Upgrade de Limite',
        price: 'R$ 49,90',
        type: 'plan'
      });
      setShowPaymentModal(true);
      return;
    }

    setRequestEmail(currentUser?.email || email);
    setShowRequestModal(true);
  }, [selectedItem, currentPlan, usedDownloads, maxDownloads, currentUser, email, addNotification]);

  const handleBuyClick = useCallback(() => {
    if (!selectedItem) return;
    
    setPaymentTarget({
      name: selectedItem.name,
      price: selectedItem.price ? `R$ ${selectedItem.price.toFixed(2)}` : 'R$ 19,90', 
      type: 'item'
    });
    setPaymentMethod('credit');
    setShowPaymentModal(true);
  }, [selectedItem]);

  // --- FORCE RESET HANDLERS ---
  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setIsSending(false); // Force stop processing
    setPaymentTarget(null);
    setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv('');
  }, []);

  const handleCloseRequestModal = useCallback(() => {
    setShowRequestModal(false);
    setIsSending(false); // Force stop processing
    setRequestEmail('');
  }, []);

  const handleRequestSubmit = useCallback(async () => {
    if (!selectedItem) return;
    if (!requestEmail) {
      addNotification("Erro", "Por favor, preencha o email.", "alert");
      return;
    }
    
    // Simple email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestEmail)) {
      addNotification("Erro", "Email inválido.", "alert");
      return;
    }
    
    setIsSending(true);
    // INSTANT PROCESSING (Test Mode)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // FIREBASE: Save download to history
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          downloads: arrayUnion({
            ...selectedItem,
            downloadedAt: new Date().toISOString()
          })
        });
      } catch (e) {
        // Fallback for demo/local
        setDownloads(prev => {
            if (!prev.find(d => d.id === selectedItem.id)) return [...prev, selectedItem];
            return prev;
        });
      }
    } else {
        // Guest mode fallback
        setDownloads(prev => {
            if (!prev.find(d => d.id === selectedItem.id)) return [...prev, selectedItem];
            return prev;
        });
    }
    
    setIsSending(false);
    setShowRequestModal(false);
    
    setSuccessType('request');
    setSuccessPlanName(selectedItem.name);
    setShowSuccessModal(true);
    setView('downloads');

    setTimeout(() => {
        addNotification(
            'Arquivo Enviado', 
            `O arquivo STL de "${selectedItem.name}" foi enviado para ${requestEmail}.`,
            'success'
        );
    }, 2000);
  }, [selectedItem, requestEmail, currentUser, addNotification]);

  const handleLogin = useCallback(async () => {
    setAuthError('');
    if (!email || !password) {
      setAuthError("Preencha o usuário/email e a senha.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const errorCode = error.code || '';
      
      if (errorCode.includes('api-key') || errorCode === 'auth/internal-error') {
         console.warn("Entrando em modo de demonstração.");
         const mockUser: any = {
             uid: 'mock-login-' + Date.now(),
             email: email,
             displayName: `Visitante (Demo)`,
             photoURL: null
         };
         setCurrentUser(mockUser);
         setUserName(mockUser.displayName);
         setView('discover');
         return;
      }

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setAuthError("Senha ou e-mail incorretos");
      } else if (errorCode === 'auth/too-many-requests') {
        setAuthError("Muitas tentativas falhas. Tente novamente mais tarde.");
      } else {
        setAuthError("Erro ao fazer login. Verifique seus dados.");
      }
    }
  }, [email, password]);

  const handleRegister = useCallback(async () => {
    setAuthError('');
    if (!regName || !regCompany || !regEmail || !regPass || !regConfirm) {
      setAuthError("Preencha todos os campos obrigatórios.");
      return;
    }
    
    if (regPass.length < 6) {
      setAuthError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (regPass !== regConfirm) {
      setAuthError("As senhas não coincidem.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPass);
      const user = userCredential.user;
      const displayNameWithCompany = `${regName} - ${regCompany}`;

      await updateProfile(user, { displayName: displayNameWithCompany });

      try {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: displayNameWithCompany,
          email: regEmail,
          company: regCompany,
          plan: null,
          downloads: [],
          createdAt: serverTimestamp()
        });
      } catch (dbError) {}
      
      setUserName(displayNameWithCompany);
      setSuccessType('register');
      setSuccessPlanName(regName);
      setShowSuccessModal(true);
    } catch (error: any) {
      const errorCode = error.code || '';

      if (errorCode.includes('api-key') || errorCode === 'auth/internal-error') {
         const mockUser: any = {
             uid: 'mock-reg-' + Date.now(),
             email: regEmail,
             displayName: `${regName} - ${regCompany}`,
             photoURL: regPhoto ? URL.createObjectURL(regPhoto) : null
         };
         setCurrentUser(mockUser);
         setUserName(mockUser.displayName);
         
         setSuccessType('register');
         setSuccessPlanName(regName);
         setShowSuccessModal(true);
         setView('discover');
         return;
      }

      if (errorCode === 'auth/email-already-in-use') {
        setAuthError("Usuário já existe. Deseja fazer login?");
      } else if (errorCode === 'auth/invalid-email') {
        setAuthError("Email inválido.");
      } else {
        setAuthError("Erro ao criar conta: " + error.message);
      }
    }
  }, [regName, regCompany, regEmail, regPass, regConfirm, regPhoto]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserName('Visitante');
      setCurrentPlan(null);
      setDownloads([]);
      setView('welcome');
      setWelcomeView('main');
      setEmail('');
      setPassword('');
    } catch (error) {
      setCurrentUser(null);
      setView('welcome');
      setWelcomeView('main');
    }
  }, []);

  const handleForgotPassword = useCallback(async () => {
    if (!forgotEmail) {
      addNotification("Atenção", "Digite seu email cadastrado.", "alert");
      return;
    }
    setIsSending(true);
    // Reduced wait time
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSending(false);
    addNotification("Sucesso", "Solicitação enviada! Verifique seu email.", "success");
    setWelcomeView('login');
    setForgotEmail('');
  }, [forgotEmail, addNotification]);

  const handleContactEmail = useCallback(async () => {
    if (!contactMessage.trim()) {
      addNotification("Atenção", "Escreva sua mensagem.", "alert");
      return;
    }
    
    if (currentUser) {
      try {
        await addDoc(collection(db, 'support_messages'), {
          userId: currentUser.uid,
          userName: userName,
          userEmail: currentUser.email,
          message: contactMessage,
          status: 'unread',
          createdAt: serverTimestamp()
        });
      } catch (e) {}
    }

    addNotification('Mensagem Enviada', 'Recebemos sua mensagem e responderemos em breve.', 'success');
    const message = `*FALE CONOSCO* 🎧\n\n👤 Usuário: ${userName}\n\n*Mensagem:*\n${contactMessage}`;
    sendToWhatsApp(message.trim());
    setShowContactModal(false);
    setContactMessage('');
  }, [contactMessage, currentUser, userName, addNotification, sendToWhatsApp]);

  const openPaymentModal = useCallback((plan: any) => {
    setPaymentTarget({ name: plan.name, price: plan.price, type: 'plan' });
    setPaymentMethod('credit'); 
    setShowPaymentModal(true);
  }, []);

  const handlePaymentSubmit = useCallback(async () => {
    if (!paymentTarget) return;
    
    // --- BYPASS VALIDATION FOR TESTING ---
    // The previous validation block has been removed to allow instant illustrative payment.
    // Real validation would go here.

    setIsSending(true);
    
    // INSTANT PROCESSING (Test Mode)
    // 300ms delay just for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    // Optimistic Update
    const targetName = paymentTarget.name;
    const targetType = paymentTarget.type;
    const itemToBuy = selectedItem;

    // FIREBASE Sync
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        if (targetType === 'plan') {
          await updateDoc(userRef, { plan: targetName });
          // Note: onSnapshot listener will update 'currentPlan' automatically
        } else if (targetType === 'item' && itemToBuy) {
          await updateDoc(userRef, {
             downloads: arrayUnion({
               ...itemToBuy,
               purchased: true,
               date: new Date().toISOString()
             })
          });
        }
      } catch (e) {
        // Fallback for Demo Mode / Offline
        if (targetType === 'plan') {
           setCurrentPlan(targetName);
        } else if (targetType === 'item' && itemToBuy) {
           setDownloads(prev => {
              if (!prev.find(d => d.id === itemToBuy.id)) return [...prev, itemToBuy];
              return prev;
           });
        }
      }
    } else {
        // Guest Fallback
        if (targetType === 'plan') {
            setCurrentPlan(targetName);
        } else if (targetType === 'item' && itemToBuy) {
            // Need to set downloads state for guest
            setDownloads(prev => {
               // Prevent duplicates
               if (!prev.find(d => d.id === itemToBuy.id)) return [...prev, itemToBuy];
               return prev;
            });
        }
    }

    setSuccessType(targetType);
    setSuccessPlanName(itemToBuy && targetType === 'item' ? itemToBuy.name : targetName);
    
    setIsSending(false);
    setShowPaymentModal(false);
    setShowSuccessModal(true);
    
    // Reset internal state
    setPaymentTarget(null);
    setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv('');
  }, [paymentTarget, paymentMethod, cardNumber, cardName, cardExpiry, cardCvv, currentUser, selectedItem, addNotification]);

  const handleSubcategoryClick = useCallback((sub: string, categoryId: string) => {
    const filtered = MOCK_ITEMS.filter(item => item.category === categoryId && (item.subcategory === sub || !item.subcategory));
    setItems(filtered.length > 0 ? filtered : MOCK_ITEMS.filter(i => i.category === categoryId));
    setListingTitle(`${categoryId} - ${sub}`);
    setIsLoadingMore(false);
    setView('listing');
  }, []);

  const handleSearch = useCallback(async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'type' in e && e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    if (!searchQuery.trim()) {
       setItems(MOCK_ITEMS);
       setListingTitle('Todos os Itens');
       setView('listing');
       return;
    }
    setIsSearching(true);
    setItems([]); 
    const aiResults = await searchJewelryWithAI(searchQuery);
    if (aiResults && aiResults.length > 0) {
      setItems(aiResults);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const localResults = MOCK_ITEMS.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) || item.description.toLowerCase().includes(lowerQuery) || item.category.toLowerCase().includes(lowerQuery)
      );
      setItems(localResults);
    }
    setListingTitle(`Busca: "${searchQuery}"`);
    setIsSearching(false);
    setView('listing');
  }, [searchQuery]);

  // Derived Calculations
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const progressPercent = useMemo(() => Math.min((usedDownloads / maxDownloads) * 100, 100), [usedDownloads, maxDownloads]);

  // --- Render Functions (Internal) ---
  
  // Note: Keeping render functions inside component for now to maintain file structure, 
  // but heavily relying on useCallback for event handlers passed to children.

  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;

    let subText = "";
    let descText = "";
    let MainIcon = PartyPopper;
    let iconColor = "text-gold";

    if (successType === 'plan') {
       MainIcon = Crown;
       iconColor = "text-gold";
       subText = `VOCÊ É CLIENTE ${successPlanName.toUpperCase()}!`;
       descText = `Parabéns! Sua assinatura foi confirmada. Aproveite todos os benefícios exclusivos e comece a baixar seus modelos agora mesmo.`;
    } else if (successType === 'item') {
       MainIcon = Gem;
       iconColor = "text-blue-400";
       subText = "Excelente Escolha!";
       descText = `O modelo ${successPlanName} é incrível. O arquivo STL já foi enviado para seu e-mail e está disponível nos seus Downloads.`;
    } else if (successType === 'register') {
       MainIcon = CheckCircle2;
       iconColor = "text-green-400";
       subText = "Cadastro Confirmado!";
       descText = `Bem-vindo, ${successPlanName}! Sua conta foi criada com sucesso. Prepare-se para elevar o nível da sua produção.`;
    } else {
       MainIcon = CheckCircle2;
       iconColor = "text-green-500";
       subText = "Pedido Confirmado!";
       descText = `Analisaremos seu pedido e em breve encaminharemos o arquivo para o seu e-mail.`;
    }

    return (
      <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6">
        <style>{`
          @keyframes confetti-fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti {
            animation: confetti-fall 3s linear forwards;
          }
        `}</style>
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(50)].map((_, i) => (
                <div key={i} className={`absolute w-3 h-3 opacity-0 animate-confetti rounded-sm ${['bg-gold', 'bg-yellow-300', 'bg-blue-400', 'bg-purple-500', 'bg-white'][i % 5]}`} style={{ left: `${Math.random() * 100}%`, top: `-10%`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${2 + Math.random() * 3}s`, transform: `rotate(${Math.random() * 360}deg)` }} />
            ))}
        </div>
        
        <div className="relative z-10 w-full max-w-sm bg-surface rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(197,160,89,0.2)] p-8 flex flex-col items-center text-center animate-scale-in overflow-hidden">
           <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none" />
           
           <div className="mb-6 mt-4 relative">
             <div className={`w-24 h-24 rounded-full bg-surface shadow-[inset_-5px_-5px_10px_rgba(255,255,255,0.05),inset_5px_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center border border-white/5 relative z-10`}>
                <MainIcon size={48} className={`${iconColor} drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] animate-bounce`} strokeWidth={1.5} />
             </div>
             <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full animate-pulse" />
           </div>

           <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gold-light to-gold tracking-tighter mb-2 drop-shadow-sm">PARABÉNS!</h1>
           <h2 className="text-lg font-bold text-gray-200 uppercase tracking-widest mb-4">{subText}</h2>
           
           <div className="bg-background/50 rounded-2xl p-4 mb-8 border border-white/5 w-full">
             <p className="text-sm text-gray-400 leading-relaxed font-medium">
               {descText}
             </p>
           </div>
           
           <NeumorphButton variant="primary" onClick={() => setShowSuccessModal(false)} className="w-full py-4 text-sm font-bold tracking-wider shadow-[0_0_20px_rgba(197,160,89,0.4)]">
              CONTINUAR NAVEGANDO
           </NeumorphButton>
        </div>
      </div>
    );
  };

  const renderContactModal = () => {
    if (!showContactModal) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-fade-in flex items-center justify-center p-6">
         <div className="w-full max-w-sm bg-background rounded-3xl shadow-2xl border border-white/5 p-6 relative">
            <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={24} /></button>
            <div className="flex flex-col items-center text-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-surface shadow-neumorph flex items-center justify-center text-gold"><Headset size={32} /></div>
              <div><h3 className="text-xl font-bold text-gray-100">Fale Conosco</h3><p className="text-sm text-gray-400 mt-1">Como podemos ajudar?</p></div>
            </div>
            <div className="space-y-4">
               <div className="bg-surface rounded-xl p-2 shadow-neumorph-pressed">
                  <textarea className="w-full h-24 bg-transparent resize-none outline-none text-gray-200 text-sm p-2 placeholder-gray-500" placeholder="Escreva sua dúvida ou reclamação aqui..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} />
               </div>
               <NeumorphCard className="flex items-center gap-4 !p-4 cursor-pointer hover:border-gold/30 border border-transparent transition-all" onClick={handleContactEmail}>
                 <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-gold shadow-neumorph-pressed"><Mail size={20} /></div>
                 <div className="flex-1 overflow-hidden"><p className="text-xs font-bold text-gray-500 uppercase">Enviar Mensagem</p><p className="text-sm text-gray-200 truncate">Suporte / Reclamação</p></div>
                 <ChevronRight size={16} className="text-gray-600" />
               </NeumorphCard>
               <NeumorphCard className="flex items-center gap-4 !p-4 cursor-pointer hover:border-green-500/30 border border-transparent transition-all" onClick={() => window.open('https://wa.me/5517991168394', '_blank')}>
                 <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-green-500 shadow-neumorph-pressed"><MessageCircle size={20} /></div>
                 <div className="flex-1 overflow-hidden"><p className="text-xs font-bold text-gray-500 uppercase">WhatsApp Direto</p><p className="text-sm text-gray-200 truncate">(17) 99116-8394</p></div>
                 <ChevronRight size={16} className="text-gray-600" />
               </NeumorphCard>
            </div>
         </div>
      </div>
    );
  };

  const renderPaymentModal = () => {
    if (!showPaymentModal || !paymentTarget) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-fade-in flex items-center justify-center p-6">
         <div className="w-full max-w-sm bg-background rounded-3xl shadow-2xl border border-white/5 p-6 relative max-h-[90vh] overflow-y-auto">
            {/* UPDATED CLOSE BUTTON TO USE HANDLER THAT RESETS STATE */}
            <button onClick={handleClosePaymentModal} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={24} /></button>
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <div className="w-14 h-14 rounded-full bg-surface shadow-neumorph flex items-center justify-center text-gold"><CreditCard size={24} /></div>
              <div><h3 className="text-xl font-bold text-gray-100">Pagamento Seguro</h3><p className="text-sm text-gray-400">{paymentTarget.type === 'plan' ? 'Assinatura' : 'Compra Única'}</p></div>
            </div>
            <div className="bg-surface rounded-xl p-4 shadow-neumorph-pressed mb-6 flex justify-between items-center">
               <div><p className="text-xs font-bold text-gray-500 uppercase">Item</p><p className="text-gray-200 font-bold">{paymentTarget.name}</p></div>
               <div className="text-right"><p className="text-xs font-bold text-gray-500 uppercase">Total</p><p className="text-gold font-bold text-lg">{paymentTarget.price}</p></div>
            </div>
            <div className="space-y-4">
               <div className="flex gap-2 p-1 bg-surface rounded-xl">
                  {(['credit', 'pix'] as const).map(m => (
                    <button key={m} onClick={() => { setPaymentMethod(m); setIsSending(false); }} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${paymentMethod === m ? 'bg-background text-gold shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>{m === 'credit' ? 'Cartão' : 'PIX'}</button>
                  ))}
               </div>
               {paymentMethod === 'credit' && (
                 <div className="space-y-3 animate-fade-in">
                    <NeumorphInput placeholder="Número do Cartão" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={16} />
                    <NeumorphInput placeholder="Nome Impresso" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                    <div className="flex gap-3">
                      <NeumorphInput placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className="text-center" maxLength={5} />
                      <NeumorphInput placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className="text-center" maxLength={3} />
                    </div>
                 </div>
               )}
               {paymentMethod === 'pix' && (
                 <div className="flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-dashed border-gray-600 animate-fade-in">
                    <QrCode size={64} className="text-gray-200 mb-4" />
                    <p className="text-xs text-gray-400 text-center mb-4">Escaneie o QR Code ou use a chave abaixo para pagar.</p>
                    <div className="w-full bg-background p-2 rounded-lg flex justify-between items-center cursor-pointer active:scale-95 transition-transform" onClick={() => addNotification('Copiado', 'Código PIX copiado com sucesso!', 'success')}>
                       <span className="text-xs text-gray-500 truncate px-2">00020126360014BR.GOV.BCB.PIX...</span><span className="text-gold font-bold text-xs">COPIAR</span>
                    </div>
                 </div>
               )}
               <NeumorphButton variant="primary" fullWidth onClick={handlePaymentSubmit} disabled={isSending}>
                 {isSending ? (
                   <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Processando...</span>
                 ) : (
                    paymentMethod === 'pix' ? 'Confirmar PIX' : `Pagar ${paymentTarget.price}`
                 )}
               </NeumorphButton>
               <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600"><KeyRound size={10} /><span>Ambiente criptografado de ponta a ponta.</span></div>
            </div>
         </div>
      </div>
    );
  };

  const renderWelcome = () => {
    if (welcomeView === 'login') {
       return (
         <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in relative z-10">
            <h2 className="text-3xl font-bold text-gray-100 mb-2">Bem-vindo de volta!</h2>
            <p className="text-gray-500 mb-8">Entre para acessar seus modelos.</p>
            
            <div className="w-full space-y-4">
              <NeumorphInput placeholder="Email ou Usuário" value={email} onChange={(e) => setEmail(e.target.value)} />
              <NeumorphInput type={showLoginPass ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} endIcon={showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />} onIconClick={() => setShowLoginPass(!showLoginPass)} />
              
              {authError && (
                 <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded-lg">{authError}</p>
              )}

              <div className="flex justify-end"><button onClick={() => setWelcomeView('forgot-password')} className="text-xs text-gold font-bold hover:underline">Esqueceu a senha?</button></div>
              <NeumorphButton variant="primary" fullWidth onClick={handleLogin}>Entrar</NeumorphButton>
              <button onClick={() => setWelcomeView('main')} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2">Voltar</button>
            </div>
         </div>
       );
    }

    if (welcomeView === 'register') {
      return (
         <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in relative z-10 overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-100 mb-2">Criar Conta</h2>
            <p className="text-gray-500 mb-8">Junte-se à comunidade R3.</p>
            <div className="w-full space-y-4">
              <div className="flex justify-center mb-2">
                  <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full bg-surface shadow-neumorph flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-gold/50 transition-colors">
                          {regPhoto ? (
                             <img src={URL.createObjectURL(regPhoto)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                             <UserIcon size={32} className="text-gray-500" />
                          )}
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center shadow-md">
                         <Camera size={14} />
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                           if (e.target.files && e.target.files[0]) {
                              setRegPhoto(e.target.files[0]);
                           }
                        }}
                      />
                  </div>
              </div>
              <NeumorphInput placeholder="Nome Completo" value={regName} onChange={(e) => setRegName(e.target.value)} />
              <NeumorphInput placeholder="Nome da Empresa" value={regCompany} onChange={(e) => setRegCompany(e.target.value)} />
              <NeumorphInput type="email" placeholder="Seu melhor Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              <NeumorphInput type={showRegPass ? "text" : "password"} placeholder="Senha" value={regPass} onChange={(e) => setRegPass(e.target.value)} endIcon={showRegPass ? <EyeOff size={18} /> : <Eye size={18} />} onIconClick={() => setShowRegPass(!showRegPass)} />
              <NeumorphInput type={showRegConfirm ? "text" : "password"} placeholder="Confirmar Senha" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} endIcon={showRegConfirm ? <EyeOff size={18} /> : <Eye size={18} />} onIconClick={() => setShowRegConfirm(!showRegConfirm)} />
              
              {authError && (
                 <div className="bg-red-500/10 p-2 rounded-lg text-center">
                    <p className="text-red-500 text-xs font-bold">{authError}</p>
                    {authError.includes("já existe") && (
                       <button onClick={() => setWelcomeView('login')} className="text-xs text-gold underline mt-1">Clique aqui para entrar</button>
                    )}
                 </div>
              )}

              <NeumorphButton variant="primary" fullWidth onClick={handleRegister}>Cadastrar</NeumorphButton>
              <button onClick={() => setWelcomeView('main')} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2">Voltar</button>
            </div>
         </div>
       );
    }

    if (welcomeView === 'forgot-password') {
      return (
         <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in relative z-10">
            <div className="w-20 h-20 rounded-full bg-surface shadow-neumorph flex items-center justify-center text-gold mb-6"><KeyRound size={32} /></div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Recuperar Senha</h2>
            <p className="text-gray-500 mb-8 text-center max-w-xs">Digite seu email para receber as instruções de redefinição.</p>
            <div className="w-full space-y-4">
              <NeumorphInput type="email" placeholder="Email cadastrado" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              <NeumorphButton variant="primary" fullWidth onClick={handleForgotPassword}>Enviar Instruções</NeumorphButton>
              <button onClick={() => setWelcomeView('login')} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2">Voltar</button>
            </div>
         </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-between p-8 relative z-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
           <div className="mb-12 relative flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
              <div className="relative flex items-center justify-center">
                 <Box size={100} className="text-gold drop-shadow-[0_0_25px_rgba(255,215,0,0.6)]" strokeWidth={1.5} />
                 <div className="absolute inset-0 flex items-center justify-center pt-3"><Gem size={32} className="text-white fill-gold/40 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" /></div>
              </div>
           </div>
           <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-4 tracking-tight">Jóias em Stl</h1>
           <p className="text-gray-400 max-w-xs leading-relaxed">A maior biblioteca de arquivos STL para joalheria. Alta definição para impressão 3D.</p>
        </div>
        <div className="w-full space-y-4 mb-8">
           <NeumorphButton variant="primary" fullWidth onClick={() => setWelcomeView('login')}>Entrar na Conta</NeumorphButton>
           <NeumorphButton variant="surface" fullWidth onClick={() => setWelcomeView('register')}>Criar Nova Conta</NeumorphButton>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    const plans = [
      { 
        name: 'Prata', 
        role: 'Básico', 
        price: 'R$ 29,90', 
        period: '/mês', 
        features: ['5 Downloads Mensais', 'Uso Pessoal'], 
        recommended: false, 
        style: 'border-slate-400/30 text-slate-300 bg-slate-400/5', 
        textColors: { title: 'text-slate-200', role: 'text-slate-400', price: 'text-slate-200' },
        variant: 'surface' as const 
      },
      { 
        name: 'Ouro', 
        role: 'Profissional', 
        price: 'R$ 49,90', 
        period: '/mês', 
        features: ['Downloads Ilimitados', 'Uso Comercial', 'Suporte Prioritário', 'Acesso sem anúncios'], 
        recommended: true, 
        style: 'border-gold/30 bg-gold/5',
        textColors: { title: 'text-gold', role: 'text-gray-500', price: 'text-gray-200' },
        variant: 'primary' as const 
      },
      { 
        name: 'Diamante', 
        role: 'Industrial', 
        price: 'R$ 1.300,00', 
        features: ['17 Downloads Total em STL', '15 Arquivos Padrão', '2 Peças Orgânicas', 'Todas as peças com jito e suporte'], 
        recommended: false, 
        style: 'border-cyan-400/30 text-cyan-300 bg-cyan-400/5 shadow-[0_0_15px_rgba(34,211,238,0.1)]', 
        textColors: { title: 'text-cyan-300', role: 'text-cyan-500', price: 'text-cyan-200' },
        variant: 'surface' as const 
      }
    ];

    return (
      <div className="h-full flex flex-col pt-8 pb-24 px-6 overflow-y-auto">
        <header className="mb-8"><h2 className="text-2xl font-semibold text-gray-200">Meu Perfil</h2><p className="text-gray-400 text-sm mt-1">Gerencie sua assinatura e envios</p></header>
        <div className="flex flex-col gap-6">
           <NeumorphCard className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface shadow-neumorph flex items-center justify-center border-2 border-gold/20">
                  {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" /> : <UserIcon className="text-gold" size={32} />}
              </div>
              <div><h3 className="text-lg font-bold text-gray-200">{userName}</h3><span className="text-xs font-medium bg-gray-700 text-gray-300 px-2 py-1 rounded-md">{currentPlan ? `Plano ${currentPlan}` : 'Sem Plano Ativo'}</span></div>
           </NeumorphCard>
           <h3 className="text-lg font-bold text-gray-200 mt-4">Planos Disponíveis</h3>
           {plans.map((plan) => (
             <div key={plan.name} className="relative">
                {plan.recommended && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10 flex items-center gap-1"><Crown size={10} /> RECOMENDADO</div>)}
                <NeumorphCard className={`flex flex-col gap-4 relative overflow-hidden border ${plan.style}`}>
                    {plan.recommended && <div className="absolute top-0 right-0 p-12 bg-gold/5 rounded-bl-[100px] pointer-events-none" />}
                    <div className="flex justify-between items-start z-0"><div><span className={`text-xs font-bold tracking-wider uppercase ${plan.textColors.role}`}>{plan.role}</span><h4 className={`text-2xl font-bold ${plan.textColors.title}`}>{plan.name}</h4></div><div className="text-right"><span className={`text-xl font-bold ${plan.textColors.price}`}>{plan.price}</span>{plan.period && <span className="text-xs text-gray-500 block">{plan.period}</span>}</div></div>
                    <div className={`w-full h-px my-1 ${plan.name === 'Diamante' ? 'bg-cyan-900/50' : plan.name === 'Prata' ? 'bg-slate-600/50' : 'bg-gray-700/50'}`} />
                    <ul className="space-y-3 z-0">{plan.features.map((feat, idx) => (<li key={idx} className="flex items-center gap-3 text-sm text-gray-400"><div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.recommended ? 'bg-gold text-surface' : plan.name === 'Diamante' ? 'bg-cyan-400/20 text-cyan-400' : plan.name === 'Prata' ? 'bg-slate-400/20 text-slate-300' : 'bg-gray-700 text-gray-400'}`}><Check size={12} strokeWidth={3} /></div>{feat}</li>))}</ul>
                    <NeumorphButton variant={plan.variant} className={`mt-2 text-sm py-3 ${plan.name === 'Diamante' ? 'text-cyan-300 border border-cyan-400/20 hover:bg-cyan-400/10' : ''}`} fullWidth onClick={() => openPaymentModal(plan)}>{plan.recommended ? 'Assinar Agora' : 'Escolher Plano'}</NeumorphButton>
                </NeumorphCard>
             </div>
           ))}
           <div className="mt-8 pb-4">
              <button onClick={handleLogout} className="w-full py-4 rounded-2xl border border-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors active:scale-95"><LogOut size={20} /><span>Sair do App</span></button>
           </div>
        </div>
      </div>
    );
  };

  const renderDiscover = () => {
    const promoPlans = [
      { 
        name: 'Prata', 
        price: 'R$ 29,90/mês', 
        highlight: 'Pacote Essencial', 
        sub: '5 Downloads Mensais', 
        icon: <Box size={20} />, 
        color: 'text-slate-200', 
        badgeColor: 'bg-slate-400/20 text-slate-300',
        border: 'border-slate-500/40 bg-slate-500/5', 
        planDetails: { name: 'Prata', price: 'R$ 29,90' } 
      },
      { 
        name: 'Ouro', 
        price: 'R$ 49,90/mês', 
        highlight: 'Downloads Ilimitados', 
        icon: <Crown size={20} />, 
        color: 'text-gold', 
        badgeColor: 'bg-gold/20 text-gold',
        border: 'border-gold/30 bg-gold/5', 
        planDetails: { name: 'Ouro', price: 'R$ 49,90' } 
      },
      { 
        name: 'Diamante', 
        price: 'R$ 1.300,00', 
        highlight: '17 Arquivos de Alta Produção', 
        sub: 'Jito e Suporte Incluso', 
        icon: <Sparkles size={20} />, 
        color: 'text-cyan-300', 
        badgeColor: 'bg-cyan-400/20 text-cyan-300',
        border: 'border-cyan-400/30 bg-cyan-400/5 shadow-[0_0_15px_rgba(34,211,238,0.1)]', 
        planDetails: { name: 'Diamante', price: 'R$ 1.300,00' } 
      }
    ];

    const planStyle = currentPlan === 'Ouro' ? 'text-gold bg-gold/10 border-gold/20' : 
                      currentPlan === 'Diamante' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' : 
                      currentPlan === 'Prata' ? 'text-slate-300 bg-slate-400/10 border-slate-400/20' :
                      'text-gray-400 bg-gray-500/10 border-gray-500/20';

    return (
      <div className="h-full flex flex-col pt-8 pb-24 px-6 overflow-y-auto">
        <header className="mb-6 flex items-center justify-between z-50 relative">
          <div>
            <p className="text-gray-400 text-sm font-medium">Bem-vindo,</p>
            <button onClick={() => setView('profile')} className="text-2xl font-bold text-gray-100 active:scale-95 transition-transform text-left block">{userName}</button>
            <div onClick={() => setView('profile')} className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${planStyle} cursor-pointer active:scale-95 transition-transform`}>
              <Crown size={12} strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {currentPlan ? `SEU PLANO: ${currentPlan}` : 'SEM PLANO ATIVO'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowContactModal(true)} className="w-10 h-10 rounded-full bg-surface shadow-neumorph flex items-center justify-center border border-white/5 active:scale-95 transition-transform text-gray-400 hover:text-gold"><Headset size={18} /></button>
             
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 rounded-full bg-surface shadow-neumorph flex items-center justify-center border border-white/5 active:scale-95 transition-transform text-gray-400 hover:text-gold relative">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold border-2 border-background">
                       {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute top-12 right-0 w-80 z-[100] animate-fade-in">
                      <NeumorphCard className="!p-0 overflow-hidden border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] bg-surface/95 backdrop-blur-xl">
                          <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                             <div className="flex items-center gap-2">
                                <Bell size={14} className="text-gold" />
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notificações</h3>
                             </div>
                             <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
                             {notifications.length === 0 ? (
                                <p className="text-center text-xs text-gray-500 py-4">Nenhuma mensagem nova.</p>
                             ) : (
                                notifications.map(notif => (
                                   <div key={notif.id} className={`p-3 rounded-lg border-l-2 relative group transition-all ${notif.type === 'success' ? 'border-green-500 bg-green-500/5' : notif.type === 'alert' ? 'border-red-500 bg-red-500/5' : 'border-gold bg-gold/5'} ${!notif.read ? 'bg-opacity-20' : 'bg-opacity-5'}`}>
                                      <div className="flex justify-between items-start mb-1">
                                          <h4 className={`text-xs font-bold ${!notif.read ? 'text-gray-100' : 'text-gray-400'}`}>{notif.title}</h4>
                                          <span className="text-[9px] text-gray-600">{notif.date}</span>
                                      </div>
                                      <p className={`text-[11px] ${!notif.read ? 'text-gray-300' : 'text-gray-500'} leading-relaxed pr-4`}>{notif.message}</p>
                                      <div className="flex justify-end mt-2 gap-2">
                                        {!notif.read && <button onClick={() => markNotificationRead(notif.id)} className="text-[9px] text-gold font-bold hover:underline">Ler</button>}
                                        <button onClick={(e) => deleteNotification(e, notif.id)} className="text-[9px] text-gray-500 hover:text-red-400">Excluir</button>
                                      </div>
                                   </div>
                                ))
                             )}
                          </div>
                      </NeumorphCard>
                  </div>
                )}
             </div>

             <button onClick={() => setView('profile')} className="w-12 h-12 rounded-full bg-surface shadow-neumorph flex items-center justify-center border border-white/5 active:scale-95 transition-transform">{currentUser?.photoURL ? <img src={currentUser.photoURL} alt="User" className="w-full h-full rounded-full object-cover"/> : <UserIcon className="text-gold" size={20} />}</button>
          </div>
        </header>

        <div className="mb-8"><div className="flex justify-between items-end mb-2 px-1"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Limite Mensal</span><span className="text-xs font-bold text-gold">{usedDownloads}/{maxDownloads} Downloads</span></div><div className="w-full h-4 bg-background rounded-full shadow-neumorph-pressed relative overflow-hidden"><div className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold-dark to-gold rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} /></div></div>
        
        <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">Planos Especiais</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x snap-mandatory touch-pan-x touch-pan-y">
                {[...promoPlans].map((plan, idx) => (
                    <NeumorphCard key={idx} className={`min-w-[280px] snap-center flex flex-col justify-between !p-4 border cursor-pointer group hover:bg-surface/80 transition-all ${plan.border} relative overflow-hidden`} onClick={() => openPaymentModal(plan.planDetails)}>
                        <div className={`absolute top-0 right-0 p-12 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px] pointer-events-none group-hover:from-white/10 transition-colors`} />
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div className={`p-2 rounded-xl bg-background shadow-neumorph ${plan.color}`}>{plan.icon}</div>
                            <div className="text-right">
                                <span className="block text-xs text-gray-500 font-bold uppercase tracking-wider">Plano</span>
                                <span className={`text-xl font-bold ${plan.color}`}>{plan.name}</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-lg font-bold text-gray-200 mb-1">{plan.highlight}</p>
                            {plan.sub && <p className="text-xs text-gray-400 mb-2">{plan.sub}</p>}
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-sm font-medium text-gray-300 bg-surface/50 px-3 py-1 rounded-lg">{plan.price}</span>
                                <span className={`text-xs font-bold ${plan.color} flex items-center gap-1`}>ASSINAR <ChevronRight size={14} /></span>
                            </div>
                        </div>
                    </NeumorphCard>
                ))}
            </div>
        </div>
        
        <div className="mb-8"><h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">Novidades da semana</h3><div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar snap-x snap-mandatory touch-pan-x touch-pan-y scroll-smooth">{MOCK_ITEMS.map((item) => (<div key={item.id} className="min-w-[260px] snap-center"><NeumorphCard className="flex flex-col gap-3 !p-3 cursor-pointer h-full group" onClick={() => openDetails(item, 'discover')}><div className="w-full h-40 rounded-2xl overflow-hidden bg-black/20 flex-shrink-0 relative"><img loading="lazy" decoding="async" src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110" /><div className="absolute top-2 right-2 bg-gold/90 backdrop-blur-sm text-surface text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">NOVO</div></div><div className="flex-1 min-w-0 flex flex-col justify-between"><div><h3 className="text-lg font-medium text-gray-200 truncate">{item.name}</h3><p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p></div><div className="flex items-center justify-between mt-3"><span className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded-full">{item.category}</span><div className="w-8 h-8 rounded-full bg-background shadow-neumorph flex items-center justify-center text-gold"><ChevronRight size={14} /></div></div></div></NeumorphCard></div>))}</div></div>
        <div className="mb-8"><h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">Categorias</h3><div className="flex flex-col gap-4"><NeumorphCard onClick={() => { setItems(MOCK_ITEMS); setListingTitle('Todos os Itens'); setIsLoadingMore(false); setView('listing'); }} className="flex items-center gap-4 !p-4 cursor-pointer transition-all active:scale-[0.98]"><div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-neumorph-pressed text-gold"><Grid size={22} strokeWidth={1.5} /></div><span className="text-lg font-medium text-gray-300 flex-1">Todos</span><ChevronRight size={20} className="text-gray-500" /></NeumorphCard>{CATEGORIES.map(cat => { let Icon = Box; if (cat.id === 'Anel') Icon = Circle; if (cat.id === 'Pingente') Icon = Gem; if (cat.id === 'Bracelete') Icon = Layers; if (cat.id === 'Colecoes') Icon = Package; const isExpanded = expandedCategory === cat.id; return (<div key={cat.id} className="flex flex-col gap-2"><NeumorphCard onClick={() => setExpandedCategory(isExpanded ? null : cat.id)} className={`flex items-center gap-4 !p-4 cursor-pointer transition-all active:scale-[0.98] ${isExpanded ? 'border border-gold/10' : ''}`}><div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-neumorph-pressed ${isExpanded ? 'text-gold' : 'text-gray-500'}`}><Icon size={22} strokeWidth={1.5} /></div><span className={`text-lg font-medium flex-1 ${isExpanded ? 'text-gold' : 'text-gray-300'}`}>{cat.label}</span><div className="text-gray-500">{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div></NeumorphCard>{isExpanded && (<div className="pl-4 pr-2 grid grid-cols-2 gap-3 animate-fade-in">{cat.subcategories.map(sub => (<button key={sub} onClick={() => handleSubcategoryClick(sub, cat.id)} className="bg-surface/50 rounded-xl p-3 text-sm text-gray-400 text-left hover:text-gold hover:bg-surface border border-transparent hover:border-gold/10 transition-all flex items-center justify-between group"><span>{sub}</span><ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-gold" /></button>))}</div>)}</div>); })}</div></div>
      </div>
    );
  };

  const renderExplore = () => {
    const materials = ['Todos', 'Ouro', 'Prata', 'Resina', 'Latão'];
    const priceRanges = ['Todos', 'Grátis', 'Pago'];
    const categoryOptions = ['Todas', ...CATEGORIES.map(c => c.id)];
    return (
      <div className="h-full flex flex-col pt-8 pb-24 px-6 overflow-y-auto">
        <header className="mb-4"><h2 className="text-2xl font-semibold text-gray-200 mb-6">Explorar</h2><div className="relative mb-4"><NeumorphInput placeholder="Busca (ex: anel de ouro)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} autoFocus /><div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 flex gap-2">{isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}</div></div><button onClick={() => setShowFilters(!showFilters)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${showFilters ? 'bg-surface text-gold shadow-neumorph' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}><div className="flex items-center gap-2"><SlidersHorizontal size={18} /><span className="text-sm font-medium">Filtros Avançados</span></div>{showFilters ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></header>
        {showFilters && (<div className="mb-8 animate-fade-in space-y-6 bg-surface/30 p-4 rounded-3xl"><div><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Categoria</h3><div className="flex flex-wrap gap-2">{categoryOptions.map(cat => (<button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCategory === cat ? 'bg-gold text-surface shadow-md' : 'bg-background text-gray-400 shadow-neumorph hover:text-gray-200'}`}>{cat}</button>))}</div></div><div><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Material</h3><div className="flex flex-wrap gap-2">{materials.map(mat => (<button key={mat} onClick={() => setFilterMaterial(mat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterMaterial === mat ? 'bg-gold text-surface shadow-md' : 'bg-background text-gray-400 shadow-neumorph hover:text-gray-200'}`}>{mat}</button>))}</div></div><div><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Preço</h3><div className="flex flex-wrap gap-2">{priceRanges.map(range => (<button key={range} onClick={() => setFilterPrice(range)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterPrice === range ? 'bg-gold text-surface shadow-md' : 'bg-background text-gray-400 shadow-neumorph hover:text-gray-200'}`}>{range}</button>))}</div></div><NeumorphButton variant="primary" fullWidth onClick={() => handleSearch()} className="py-2 text-sm">Buscar com Filtros</NeumorphButton></div>)}
        {!showFilters && (<div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4"><Search size={48} /><p className="text-sm">O que você está procurando hoje?</p></div>)}
      </div>
    );
  };

  const renderListing = () => (
    <div className="h-full flex flex-col pt-8 pb-24 px-6 overflow-y-auto" onScroll={() => {}}>
      <header className="flex items-center justify-between mb-8"><button onClick={() => setView('discover')} className="p-3 rounded-xl bg-surface shadow-neumorph text-gray-400 active:scale-95 transition-transform"><ArrowLeft size={20} /></button><span className="text-lg font-medium text-gray-200 truncate max-w-[60%]">{listingTitle}</span><div className="w-10" /></header>
      <div className="grid grid-cols-1 gap-6 pb-6">{items.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-gray-500"><Search size={48} className="mb-4 opacity-50" /><p>Nenhum item encontrado.</p></div>) : (items.map(item => (<NeumorphCard key={item.id} className="flex items-center gap-4 !p-3 cursor-pointer" onClick={() => openDetails(item, 'listing')}><div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/20 flex-shrink-0 relative"><img loading="lazy" decoding="async" src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80" />{item.price === 0 && <span className="absolute bottom-1 right-1 bg-green-500/80 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">Grátis</span>}</div><div className="flex-1"><h3 className="text-lg font-medium text-gray-200">{item.name}</h3><div className="flex justify-between items-center mt-1"><p className="text-sm text-gray-500">{item.category}</p><p className="text-sm font-bold text-gold">{!item.price ? 'Grátis' : `R$ ${item.price.toFixed(2)}`}</p></div></div><div className="w-10 h-10 rounded-full bg-background shadow-neumorph-pressed flex items-center justify-center text-gold"><ArrowLeft className="rotate-180" size={18} /></div></NeumorphCard>)))} {isLoadingMore && (<div className="col-span-1 flex justify-center py-4"><Loader2 className="animate-spin text-gold" size={24} /></div>)}</div>
    </div>
  );

  const renderFavorites = () => (
    <div className="h-full flex flex-col pt-8 pb-24 px-6 overflow-y-auto">
      <header className="mb-8"><h2 className="text-2xl font-semibold text-gray-200">Meus Favoritos</h2><p className="text-gray-400 text-sm mt-1">Seus modelos salvos</p></header>
      {favorites.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4"><Heart size={48} /><p>Você ainda não tem favoritos.</p></div>) : (<div className="grid grid-cols-1 gap-6 pb-6">{favorites.map(item => (<NeumorphCard key={item.id} className="flex items-center gap-4 !p-3 cursor-pointer group" onClick={() => openDetails(item, 'favorites')}><div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/20 flex-shrink-0 relative"><img loading="lazy" decoding="async" src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80" /><div className="absolute top-1 right-1"><Heart size={14} className="text-red-500 fill-red-500" /></div></div><div className="flex-1"><h3 className="text-lg font-medium text-gray-200">{item.name}</h3><p className="text-sm text-gray-500">{item.category}</p></div><div className="w-10 h-10 rounded-full bg-background shadow-neumorph-pressed flex items-center justify-center text-gold"><ArrowLeft className="rotate-180" size={18} /></div></NeumorphCard>))}</div>)}
    </div>
  );

  const renderDetails = () => {
    if (!selectedItem) return null;
    const isFav = favorites.some(f => f.id === selectedItem.id);
    const images = selectedItem.images && selectedItem.images.length >= 3 ? selectedItem.images : [selectedItem.imageUrl, selectedItem.imageUrl, selectedItem.imageUrl];
    return (
      <div className="h-full flex flex-col pt-8 pb-24 px-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-6"><button onClick={() => setView(previousView)} className="p-3 rounded-xl bg-surface shadow-neumorph text-gray-400 active:scale-95 transition-transform"><ArrowLeft size={20} /></button><span className="text-lg font-medium text-gray-400">Detalhes</span><div className="w-10" /></header>
        <div className="flex flex-col items-center space-y-6">
          <div className="w-full aspect-square rounded-[2rem] bg-surface shadow-neumorph p-3 relative group cursor-zoom-in" onClick={() => setIsZoomOpen(true)}><div className="w-full h-full rounded-[1.5rem] overflow-hidden relative"><img loading="lazy" decoding="async" src={images[activeImageIndex]} className="w-full h-full object-cover transition-opacity duration-300" alt={selectedItem.name} /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" /><div className="absolute top-4 left-4 text-white/50 bg-black/20 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={16} /></div></div><button onClick={(e) => toggleFavorite(e, selectedItem)} className={`absolute top-6 right-6 w-16 h-16 bg-surface/90 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center transition-colors duration-300 z-20 ${isFav ? 'ring-2 ring-red-500/20' : ''}`}><Heart size={32} fill={isFav ? "#EF4444" : "none"} className={`transition-colors duration-300 ${isFav ? "text-red-500" : "text-gray-400"}`} /></button></div>
          <div className="flex justify-center gap-4 w-full">{images.slice(0, 3).map((img, idx) => (<button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-20 h-20 rounded-xl overflow-hidden shadow-neumorph transition-all duration-300 ${activeImageIndex === idx ? 'ring-2 ring-gold scale-105' : 'opacity-70 grayscale'}`}><img loading="lazy" src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" /></button>))}</div>
          <div className="text-center space-y-2 flex flex-col items-center"><h2 className="text-2xl font-bold text-gray-100">{selectedItem.name}</h2><p className="text-gold font-medium tracking-wide text-sm uppercase">{selectedItem.category}</p><div className="inline-flex items-center justify-center gap-2 bg-surface px-5 py-2 rounded-xl shadow-neumorph-pressed border border-white/5 mt-2"><DollarSign size={16} className="text-gold" /><span className="text-xl font-bold text-gray-200">{!selectedItem.price ? 'Grátis' : `R$ ${selectedItem.price.toFixed(2).replace('.', ',')}`}</span></div></div>
          <p className="text-gray-400 text-center leading-relaxed text-sm bg-surface p-4 rounded-2xl shadow-neumorph-pressed">{selectedItem.description}</p>
          <div className="w-full"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">Especificações Técnicas</h3><div className="grid grid-cols-2 gap-4"><SpecItem label="Material" value={selectedItem.material} icon={<Gem size={14} />} /><SpecItem label="Peso Aprox." value={selectedItem.weight} icon={<Scale size={14} />} /><SpecItem label="Código" value={selectedItem.sku} icon={<Hash size={14} />} /><SpecItem label="Adicionado em" value={selectedItem.createdAt} icon={<Calendar size={14} />} />{selectedItem.ringSize && (<SpecItem label="Numeração" value={selectedItem.ringSize} icon={<Ruler size={14} />} />)}{selectedItem.stoneCount !== undefined && selectedItem.stoneCount > 0 && (<><SpecItem label="Qtd. Pedras" value={selectedItem.stoneCount?.toString()} icon={<Gem size={14} />} /><SpecItem label="Tam. Pedra" value={selectedItem.stoneSize} icon={<Ruler size={14} />} /><SpecItem label="Formato" value={selectedItem.stoneShape} icon={<Box size={14} />} /></>)}</div></div>
          {selectedItem.category === 'Anel' && (<div className="w-full mt-2"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Numeração do Anel</h3><NeumorphInput placeholder="Digite o aro (Ex: 16)" value={customRingSize} onChange={(e) => setCustomRingSize(e.target.value)} type="number" /></div>)}
          <div className="w-full pt-4 pb-4 flex gap-4"><NeumorphButton fullWidth variant="surface" onClick={handleBuyClick} className="flex-1"><div className="flex items-center gap-2"><ShoppingCart size={20} /><span>Comprar</span></div></NeumorphButton><NeumorphButton fullWidth variant="primary" onClick={handleRequestClick} className="flex-1"><div className="flex items-center gap-2"><Mail size={20} /><span>Solicitar STL</span></div></NeumorphButton></div>
        </div>
      </div>
    );
  };

  const renderDownloads = () => (
    <div className="h-full flex flex-col pt-8 pb-24 px-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-200">Meus Downloads</h2>
      {downloads.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50"><Download size={48} className="mb-4" /><p>Nenhum download ainda.</p></div>) : (<div className="flex flex-col gap-4 overflow-y-auto">{downloads.map(item => (<NeumorphCard key={item.id} className="flex items-center gap-4 !p-3 cursor-pointer group" onClick={() => openDetails(item, 'downloads')}><div className="w-16 h-16 rounded-xl overflow-hidden bg-black/20 flex-shrink-0 relative"><img loading="lazy" src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80" /></div><div className="flex-1"><h4 className="text-gray-200 font-medium">{item.name}</h4><div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-bold">Solicitado</span><span className="text-[10px] text-gray-500">{item.sku}</span></div></div><div className="w-10 h-10 rounded-full bg-surface shadow-neumorph text-gold flex items-center justify-center"><ChevronRight size={18} /></div></NeumorphCard>))}</div>)}
    </div>
  );

  const renderZoomModal = () => {
    if (!isZoomOpen || !selectedItem) return null;
    const images = selectedItem.images && selectedItem.images.length >= 3 ? selectedItem.images : [selectedItem.imageUrl];
    
    return (
      <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center animate-fade-in touch-none">
         <button onClick={() => { setIsZoomOpen(false); setZoomLevel(1); }} className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full backdrop-blur-md z-50 hover:bg-white/20 transition-colors"><X size={24} /></button>
         <div className="flex-1 w-full flex items-center justify-center p-4 overflow-hidden" onDoubleClick={() => setZoomLevel(prev => prev > 1 ? 1 : 2)}>
            <img 
              src={images[activeImageIndex]} 
              alt="Zoom View" 
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            />
         </div>
         <div className="absolute bottom-8 flex gap-6 bg-surface/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
             <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="text-white hover:text-gold active:scale-90 transition-transform"><TrendingDown size={24} /></button>
             <span className="flex items-center justify-center text-white font-mono font-bold w-12">{Math.round(zoomLevel * 100)}%</span>
             <button onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))} className="text-white hover:text-gold active:scale-90 transition-transform"><TrendingUp size={24} /></button>
         </div>
      </div>
    );
  };

  const renderRequestModal = () => {
    if (!showRequestModal || !selectedItem) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-fade-in flex items-center justify-center p-6">
         <div className="w-full max-w-sm bg-background rounded-3xl shadow-2xl border border-white/5 p-6 relative">
            <button onClick={handleCloseRequestModal} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={24} /></button>
            <div className="flex flex-col items-center text-center gap-4 mb-6">
               <div className="w-16 h-16 rounded-full bg-surface shadow-neumorph flex items-center justify-center text-gold">
                  <Mail size={32} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-100">Solicitar Arquivo STL</h3>
                 <p className="text-sm text-gray-400 mt-1">O arquivo será enviado para seu e-mail.</p>
               </div>
            </div>

            <div className="bg-surface rounded-xl p-3 mb-6 flex items-center gap-4 shadow-neumorph-pressed border border-white/5">
               <div className="w-14 h-14 rounded-lg bg-black/20 overflow-hidden flex-shrink-0">
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-gray-200 font-bold text-sm truncate">{selectedItem.name}</h4>
                  <p className="text-xs text-gold font-bold mt-0.5">Ref: {selectedItem.sku || 'N/A'}</p>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">E-mail para envio</label>
                 <NeumorphInput 
                    type="email" 
                    placeholder="exemplo@email.com" 
                    value={requestEmail} 
                    onChange={(e) => setRequestEmail(e.target.value)} 
                    className="!py-3"
                 />
               </div>
               
               <div className="bg-gold/5 rounded-lg p-3 border border-gold/10">
                 <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                   {currentPlan ? `Como membro ${currentPlan}, seu pedido tem prioridade alta.` : 'Usuários gratuitos podem levar até 24h para receber o arquivo.'}
                 </p>
               </div>

               <NeumorphButton variant="primary" fullWidth onClick={handleRequestSubmit} disabled={isSending}>
                 {isSending ? (
                   <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Processando...</span>
                 ) : (
                   <span className="flex items-center gap-2"><Send size={18} /> Confirmar Pedido</span>
                 )}
               </NeumorphButton>
            </div>
         </div>
      </div>
    );
  };

  // Memoized Bottom Navigation
  const BottomNav = useMemo(() => (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-background flex items-center justify-around px-4 rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-50">
      <NavIcon icon={<Home size={22} />} label="Início" active={view === 'discover'} onClick={() => setView('discover')} />
      <NavIcon icon={<Search size={22} />} label="Explorar" active={view === 'explore'} onClick={() => setView('explore')} />
      <NavIcon icon={<Heart size={22} />} label="Favoritos" active={view === 'favorites'} onClick={() => setView('favorites')} />
      <NavIcon icon={<Download size={22} />} label="Downloads" active={view === 'downloads'} onClick={() => setView('downloads')} />
      <NavIcon icon={<UserIcon size={22} />} label="Perfil" active={view === 'profile'} onClick={() => setView('profile')} />
    </div>
  ), [view]);

  if (authLoading && view !== 'welcome') {
      return <div className="w-full h-screen bg-background flex items-center justify-center"><Loader2 className="text-gold animate-spin" size={48} /></div>;
  }

  return (
    <div className="w-full h-screen bg-background overflow-hidden relative selection:bg-gold selection:text-white">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
      {view === 'welcome' && renderWelcome()}
      {view === 'discover' && renderDiscover()}
      {view === 'explore' && renderExplore()}
      {view === 'listing' && renderListing()}
      {view === 'details' && renderDetails()}
      {view === 'favorites' && renderFavorites()}
      {view === 'downloads' && renderDownloads()}
      {view === 'profile' && renderProfile()}
      {renderZoomModal()}
      {renderRequestModal()}
      {renderContactModal()}
      {renderPaymentModal()}
      {renderSuccessModal()}
      {view !== 'welcome' && BottomNav}
    </div>
  );
};

export default App;
