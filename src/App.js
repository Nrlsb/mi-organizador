import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

// --- Íconos (SVG como componentes de React) ---
const HomeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> );
const ShoppingCartIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> );
const DollarSignIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> );
const TrashIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );
const CopyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> );
const LogOutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> );

// --- Configuración de Firebase ---
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Componente de Autenticación ---
function AuthScreen({ auth }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError(''); // Limpiar errores previos
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Organizador del Hogar</h1>
                <p className="text-center text-gray-500 mb-8">{isLogin ? 'Inicia sesión para continuar' : 'Crea una cuenta para empezar'}</p>
                <form onSubmit={handleAuthAction}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="tu@correo.com" required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
                        <input
                            type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••••" required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex flex-col items-center justify-between">
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors">
                            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                        </button>
                        <button type="button" onClick={() => setIsLogin(!isLogin)} className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 mt-4">
                            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Componentes de la App (Tasks, MarketList, Expenses) - Sin cambios ---
function Tasks({ db, groupId }) {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) return; setLoading(true);
        const tasksCollectionPath = `groups/${groupId}/tasks`;
        const q = query(collection(db, tasksCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const tasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            tasksData.sort((a, b) => (a.completed - b.completed) || ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            setTasks(tasksData); setLoading(false);
        });
        return unsubscribe;
    }, [groupId]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (newTask.trim() === '' || !groupId) return;
        await addDoc(collection(db, `groups/${groupId}/tasks`), { text: newTask, completed: false, createdAt: serverTimestamp() });
        setNewTask('');
    };
    const handleToggleTask = async (task) => await updateDoc(doc(db, `groups/${groupId}/tasks`, task.id), { completed: !task.completed });
    const handleDeleteTask = async (taskId) => await deleteDoc(doc(db, `groups/${groupId}/tasks`, taskId));

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Tareas Domésticas</h2>
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Ej. Limpiar la cocina" className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"/>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold shadow">Agregar</button>
            </form>
            {loading ? <p>Cargando tareas...</p> : <ul className="space-y-3">{tasks.map(task => (<li key={task.id} className={`flex items-center justify-between p-3 rounded-lg transition ${task.completed ? 'bg-green-100 text-gray-500' : 'bg-gray-100'}`}><span className={`flex-grow cursor-pointer ${task.completed ? 'line-through' : ''}`} onClick={() => handleToggleTask(task)}>{task.text}</span><button onClick={() => handleDeleteTask(task.id)} className="ml-4 text-red-500 hover:text-red-700 transition"><TrashIcon className="w-5 h-5" /></button></li>))}</ul>}
        </div>
    );
}
function MarketList({ db, groupId }) {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) return; setLoading(true);
        const marketCollectionPath = `groups/${groupId}/market_items`;
        const q = query(collection(db, marketCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            itemsData.sort((a, b) => (a.checked - b.checked) || ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            setItems(itemsData); setLoading(false);
        });
        return unsubscribe;
    }, [groupId]);
    
    const handleAddItem = async (e) => {
        e.preventDefault();
        if (newItem.trim() === '' || !groupId) return;
        await addDoc(collection(db, `groups/${groupId}/market_items`), { name: newItem, checked: false, createdAt: serverTimestamp() });
        setNewItem('');
    };
    const handleToggleItem = async (item) => await updateDoc(doc(db, `groups/${groupId}/market_items`, item.id), { checked: !item.checked });
    const handleDeleteItem = async (itemId) => await deleteDoc(doc(db, `groups/${groupId}/market_items`, itemId));

    return (
         <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Lista de Supermercado</h2>
            <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
                <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Ej. Leche, pan, huevos..." className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"/>
                <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-semibold shadow">Agregar</button>
            </form>
             {loading ? <p>Cargando lista...</p> : <ul className="space-y-3">{items.map(item => (<li key={item.id} className={`flex items-center justify-between p-3 rounded-lg transition ${item.checked ? 'bg-green-100 text-gray-500' : 'bg-gray-100'}`}><span className={`flex-grow cursor-pointer ${item.checked ? 'line-through' : ''}`} onClick={() => handleToggleItem(item)}>{item.name}</span><button onClick={() => handleDeleteItem(item.id)} className="ml-4 text-red-500 hover:text-red-700 transition"><TrashIcon className="w-5 h-5" /></button></li>))}</ul>}
        </div>
    );
}
function Expenses({ db, groupId }) {
    const [expenses, setExpenses] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) return; setLoading(true);
        const expensesCollectionPath = `groups/${groupId}/expenses`;
        const q = query(collection(db, expensesCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const expensesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            expensesData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setExpenses(expensesData); setLoading(false);
        });
        return unsubscribe;
    }, [groupId]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const expenseAmount = parseFloat(amount);
        if (description.trim() === '' || isNaN(expenseAmount) || expenseAmount <= 0 || !groupId) return;
        await addDoc(collection(db, `groups/${groupId}/expenses`), { description, amount: expenseAmount, createdAt: serverTimestamp() });
        setDescription(''); setAmount('');
    };
    const handleDeleteExpense = async (expenseId) => await deleteDoc(doc(db, `groups/${groupId}/expenses`, expenseId));
    const totalExpenses = useMemo(() => expenses.reduce((total, expense) => total + expense.amount, 0), [expenses]);

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Control de Gastos</h2>
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (ej. Supermercado)" className="md:col-span-2 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"/>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto ($)" className="p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"/>
                <button type="submit" className="md:col-span-3 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold shadow">Agregar Gasto</button>
            </form>
            {loading ? <p>Cargando gastos...</p> : <div className="mt-6"><ul className="space-y-3 mb-4">{expenses.map(expense => (<li key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-100"><span>{expense.description}</span><div className="flex items-center"><span className="font-semibold text-gray-800">${expense.amount.toFixed(2)}</span><button onClick={() => handleDeleteExpense(expense.id)} className="ml-4 text-red-500 hover:text-red-700 transition"><TrashIcon className="w-5 h-5" /></button></div></li>))}</ul><div className="text-right text-2xl font-bold p-4 bg-gray-200 rounded-lg">Total: <span className="text-green-600">${totalExpenses.toFixed(2)}</span></div></div>}
        </div>
    );
}

// --- Componente Principal de la App ---
export default function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('tasks');
    const [groupId, setGroupId] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        return onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
    }, []);

    useEffect(() => {
        const getGroupIdFromUrl = () => window.location.hash.replace(/^#\/?/, '');
        const initialGroupId = getGroupIdFromUrl();
        if (initialGroupId) {
            setGroupId(initialGroupId);
        } else {
            const newGroupId = Math.random().toString(36).substring(2, 9);
            window.location.hash = newGroupId;
            setGroupId(newGroupId);
        }
        const handleHashChange = () => setGroupId(getGroupIdFromUrl());
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleLogout = async () => await signOut(auth);
    
    const copyUrlToClipboard = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    if (!user) {
        return <AuthScreen auth={auth} />;
    }

    const renderView = () => {
        if (!groupId) return <div className="text-center p-10"><p className="text-lg">Inicializando y conectando grupo...</p></div>;
        switch (view) {
            case 'tasks': return <Tasks db={db} groupId={groupId} />;
            case 'market': return <MarketList db={db} groupId={groupId} />;
            case 'expenses': return <Expenses db={db} groupId={groupId} />;
            default: return <Tasks db={db} groupId={groupId} />;
        }
    };
    
    const NavButton = ({ activeView, targetView, setView, children, icon }) => (
        <button onClick={() => setView(targetView)} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 font-semibold rounded-t-lg transition-all duration-300 ${activeView === targetView ? 'bg-white text-blue-600 shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            {icon} <span className="text-sm sm:text-base">{children}</span>
        </button>
    );

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <header className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h1 className="text-4xl font-bold text-gray-800">Organizador del Hogar</h1>
                        <div className="text-right">
                           <p className="text-sm text-gray-600">{user.email}</p>
                           <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-800 font-semibold">
                               <LogOutIcon /> Salir
                           </button>
                        </div>
                    </div>
                    <p className="text-center text-gray-500">Tus listas compartidas en tiempo real.</p>
                </header>

                <main>
                    <div className="flex justify-center rounded-t-lg">
                        <NavButton activeView={view} targetView='tasks' setView={setView} icon={<HomeIcon/>}>Tareas</NavButton>
                        <NavButton activeView={view} targetView='market' setView={setView} icon={<ShoppingCartIcon/>}>Supermercado</NavButton>
                        <NavButton activeView={view} targetView='expenses' setView={setView} icon={<DollarSignIcon/>}>Gastos</NavButton>
                    </div>
                    <div className="rounded-b-lg overflow-hidden">{renderView()}</div>
                </main>
                
                 <footer className="text-center mt-8 text-sm text-gray-500 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="font-semibold text-blue-800">¡Colabora con otros!</p>
                    <p className="my-2">Comparte esta URL con tu familia o amigos para que vean y editen las listas en tiempo real.</p>
                    <div className="flex justify-center mt-2">
                        <button onClick={copyUrlToClipboard} className="flex items-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 shadow">
                           <CopyIcon /> {copied ? '¡URL Copiada!' : 'Copiar enlace de invitación'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

