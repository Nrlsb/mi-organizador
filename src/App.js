import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const ShoppingCartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
);
const DollarSignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const TrashIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

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

// --- Componente de Tareas ---
function Tasks({ db, userId }) {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        const tasksCollectionPath = `users/${userId}/tasks`;
        const q = query(collection(db, tasksCollectionPath));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const tasksData = [];
            querySnapshot.forEach((doc) => {
                tasksData.push({ id: doc.id, ...doc.data() });
            });
            // Ordenar en el cliente: no completadas primero, luego por fecha
            tasksData.sort((a, b) => {
                if (a.completed === b.completed) {
                    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                }
                return a.completed ? 1 : -1;
            });
            setTasks(tasksData);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener tareas: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (newTask.trim() === '' || !userId) return;
        try {
            const tasksCollectionPath = `users/${userId}/tasks`;
            await addDoc(collection(db, tasksCollectionPath), {
                text: newTask,
                completed: false,
                createdAt: serverTimestamp()
            });
            setNewTask('');
        } catch (error) {
            console.error("Error al agregar tarea: ", error);
        }
    };

    const handleToggleTask = async (task) => {
        if (!userId) return;
        const taskDocRef = doc(db, `users/${userId}/tasks`, task.id);
        await updateDoc(taskDocRef, { completed: !task.completed });
    };

    const handleDeleteTask = async (taskId) => {
        if (!userId) return;
        const taskDocRef = doc(db, `users/${userId}/tasks`, taskId);
        await deleteDoc(taskDocRef);
    };

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Tareas Domésticas</h2>
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Ej. Limpiar la cocina"
                    className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold shadow">Agregar</button>
            </form>
            {loading ? (
                <p>Cargando tareas...</p>
            ) : (
                <ul className="space-y-3">
                    {tasks.map((task) => (
                        <li key={task.id} className={`flex items-center justify-between p-3 rounded-lg transition ${task.completed ? 'bg-green-100 text-gray-500' : 'bg-gray-100'}`}>
                            <span
                                className={`flex-grow cursor-pointer ${task.completed ? 'line-through' : ''}`}
                                onClick={() => handleToggleTask(task)}
                            >
                                {task.text}
                            </span>
                            <button onClick={() => handleDeleteTask(task.id)} className="ml-4 text-red-500 hover:text-red-700 transition">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// --- Componente de Lista de Supermercado ---
function MarketList({ db, userId }) {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
       const marketCollectionPath = `users/${userId}/market_items`;
        const q = query(collection(db, marketCollectionPath));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const itemsData = [];
            querySnapshot.forEach((doc) => {
                itemsData.push({ id: doc.id, ...doc.data() });
            });
            itemsData.sort((a, b) => {
                 if (a.checked === b.checked) {
                    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                }
                return a.checked ? 1 : -1;
            });
            setItems(itemsData);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener items del mercado: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);
    
    const handleAddItem = async (e) => {
        e.preventDefault();
        if (newItem.trim() === '' || !userId) return;
        const marketCollectionPath = `users/${userId}/market_items`;
        await addDoc(collection(db, marketCollectionPath), {
            name: newItem,
            checked: false,
            createdAt: serverTimestamp()
        });
        setNewItem('');
    };

    const handleToggleItem = async (item) => {
        if (!userId) return;
        const itemDocRef = doc(db, `users/${userId}/market_items`, item.id);
        await updateDoc(itemDocRef, { checked: !item.checked });
    };

    const handleDeleteItem = async (itemId) => {
        if (!userId) return;
        const itemDocRef = doc(db, `users/${userId}/market_items`, itemId);
        await deleteDoc(itemDocRef);
    };

    return (
         <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Lista de Supermercado</h2>
            <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Ej. Leche, pan, huevos..."
                    className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                />
                <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-semibold shadow">Agregar</button>
            </form>
             {loading ? (
                <p>Cargando lista...</p>
            ) : (
                <ul className="space-y-3">
                    {items.map((item) => (
                        <li key={item.id} className={`flex items-center justify-between p-3 rounded-lg transition ${item.checked ? 'bg-green-100 text-gray-500' : 'bg-gray-100'}`}>
                           <span
                                className={`flex-grow cursor-pointer ${item.checked ? 'line-through' : ''}`}
                                onClick={() => handleToggleItem(item)}
                            >
                                {item.name}
                            </span>
                            <button onClick={() => handleDeleteItem(item.id)} className="ml-4 text-red-500 hover:text-red-700 transition">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// --- Componente de Gastos ---
function Expenses({ db, userId }) {
    const [expenses, setExpenses] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
       const expensesCollectionPath = `users/${userId}/expenses`;
        const q = query(collection(db, expensesCollectionPath));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const expensesData = [];
            querySnapshot.forEach((doc) => {
                expensesData.push({ id: doc.id, ...doc.data() });
            });
             expensesData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setExpenses(expensesData);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener gastos: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const expenseAmount = parseFloat(amount);
        if (description.trim() === '' || isNaN(expenseAmount) || expenseAmount <= 0 || !userId) {
            // Se puede agregar una notificación visual al usuario aquí
            return;
        }
        const expensesCollectionPath = `users/${userId}/expenses`;
        await addDoc(collection(db, expensesCollectionPath), {
            description,
            amount: expenseAmount,
            createdAt: serverTimestamp()
        });
        setDescription('');
        setAmount('');
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!userId) return;
        const expenseDocRef = doc(db, `users/${userId}/expenses`, expenseId);
        await deleteDoc(expenseDocRef);
    };

    const totalExpenses = useMemo(() => {
        return expenses.reduce((total, expense) => total + expense.amount, 0);
    }, [expenses]);


    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Control de Gastos</h2>
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción (ej. Supermercado)"
                    className="md:col-span-2 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Monto ($)"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                />
                <button type="submit" className="md:col-span-3 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold shadow">Agregar Gasto</button>
            </form>
            <div className="mt-6">
                 {loading ? (
                    <p>Cargando gastos...</p>
                 ) : (
                    <>
                        <ul className="space-y-3 mb-4">
                            {expenses.map((expense) => (
                                <li key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                                    <span>{expense.description}</span>
                                    <div className="flex items-center">
                                        <span className="font-semibold text-gray-800">${expense.amount.toFixed(2)}</span>
                                        <button onClick={() => handleDeleteExpense(expense.id)} className="ml-4 text-red-500 hover:text-red-700 transition">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="text-right text-2xl font-bold p-4 bg-gray-200 rounded-lg">
                            Total: <span className="text-green-600">${totalExpenses.toFixed(2)}</span>
                        </div>
                    </>
                 )}
            </div>
        </div>
    );
}


// --- Componente Principal de la App ---
export default function App() {
    const [view, setView] = useState('tasks');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Error en el inicio de sesión anónimo:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);
    
    const renderView = () => {
        if (!isAuthReady) {
            return <div className="text-center p-10"><p className="text-lg">Inicializando y conectando...</p></div>;
        }
        switch (view) {
            case 'tasks':
                return <Tasks db={db} userId={userId} />;
            case 'market':
                return <MarketList db={db} userId={userId} />;
            case 'expenses':
                return <Expenses db={db} userId={userId} />;
            default:
                return <Tasks db={db} userId={userId} />;
        }
    };
    
    const NavButton = ({ activeView, targetView, setView, children, icon }) => {
        const isActive = activeView === targetView;
        return (
             <button
                onClick={() => setView(targetView)}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 font-semibold rounded-t-lg transition-all duration-300 ${isActive ? 'bg-white text-blue-600 shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
             >
                 {icon}
                 <span className="text-sm sm:text-base">{children}</span>
             </button>
        )
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
             <style>{`
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <header className="mb-6">
                    <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">Organizador del Hogar</h1>
                    <p className="text-center text-gray-500">Gestiona tu vida doméstica de forma sencilla.</p>
                </header>

                <main>
                    <div className="flex justify-center rounded-t-lg">
                        <NavButton activeView={view} targetView='tasks' setView={setView} icon={<HomeIcon/>}>Tareas</NavButton>
                        <NavButton activeView={view} targetView='market' setView={setView} icon={<ShoppingCartIcon/>}>Supermercado</NavButton>
                        <NavButton activeView={view} targetView='expenses' setView={setView} icon={<DollarSignIcon/>}>Gastos</NavButton>
                    </div>
                    <div className="rounded-b-lg overflow-hidden">
                        {renderView()}
                    </div>
                </main>
                
                 <footer className="text-center mt-8 text-xs text-gray-400">
                    <p>ID de sesión (para soporte o colaboración):</p>
                    <p className="font-mono bg-gray-200 p-1 rounded inline-block">{isAuthReady ? userId || "Cargando..." : "Cargando..."}</p>
                </footer>
            </div>
        </div>
    );
}
