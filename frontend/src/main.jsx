import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/app.css';
import App from './App.jsx';
import {WorkspaceProvider} from './context/Workspace.jsx';
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><WorkspaceProvider><App/></WorkspaceProvider></BrowserRouter></React.StrictMode>);
