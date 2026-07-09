<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <!-- Viewport responsive meta tag configured according to design guidelines -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Casas y Espacios Agent v2.2 — Workspace de Diseño Corporativo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            background: radial-gradient(circle at 50% 0%, #292926 0%, #151514 100%);
            background-color: #151514;
            color: #F0F0F5;
        }

        /* Custom scrollbar optimized for high-density tools */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #151514;
        }
        ::-webkit-scrollbar-thumb {
            background: #3A3A37;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #01A4E3;
        }

        /* Red glowing pulse animation for critical state A2 (>15m wait) */
        @keyframes criticalPulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 91, 91, 0.4); border-color: rgba(255, 91, 91, 0.8); }
            50% { box-shadow: 0 0 16px 4px rgba(255, 91, 91, 0.25); border-color: rgba(255, 91, 91, 1); }
            100% { box-shadow: 0 0 0 0 rgba(255, 91, 91, 0); border-color: rgba(255, 91, 91, 0.6); }
        }
        .critical-pulse-card {
            animation: criticalPulse 2s infinite ease-in-out;
            border-left: 4px solid #FF5B5B !important;
            background: rgba(255, 91, 91, 0.03) !important;
        }

        /* Blue active animation for WebSocket normal state */
        @keyframes wsPulse {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.25); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.6; }
        }
        .ws-pulse-dot {
            animation: wsPulse 1.6s infinite ease-in-out;
        }

        /* Annotation Border Overlay */
        .annotation-border {
            border: 1px dashed #01A4E3 !important;
            position: relative;
        }

        /* Interactive Card Styling in Inbox */
        #bandeja-real-cards > div {
            background: rgba(37, 37, 34, 0.65);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(58, 58, 55, 0.5);
            border-radius: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
        }
        #bandeja-real-cards > div:hover {
            transform: translateY(-3px);
            border-color: rgba(1, 164, 227, 0.5);
            box-shadow: 0 16px 24px -10px rgba(0, 0, 0, 0.6), 0 0 20px 2px rgba(1, 164, 227, 0.12);
            background: rgba(37, 37, 34, 0.85);
        }

        /* Premium status pill glow effects */
        .bg-\[\#FF5B5B\]\/15 {
            box-shadow: 0 0 8px rgba(255, 91, 91, 0.15);
        }
        .bg-\[\#00D4AA\]\/15 {
            box-shadow: 0 0 8px rgba(0, 212, 170, 0.15);
        }
        .bg-\[\#FFB84D\]\/15 {
            box-shadow: 0 0 8px rgba(255, 184, 77, 0.15);
        }

        /* Upgrade primary blue components to gradient with shadows */
        .bg-\[\#01A4E3\] {
            background: linear-gradient(135deg, #01A4E3 0%, #008cc2 100%) !important;
            box-shadow: 0 4px 12px rgba(1, 164, 227, 0.2);
            transition: all 0.2s ease;
        }
        .bg-\[\#01A4E3\]:hover {
            background: linear-gradient(135deg, #02b2f5 0%, #0199d4 100%) !important;
            box-shadow: 0 6px 16px rgba(1, 164, 227, 0.35);
            transform: translateY(-1px);
        }

        /* Active Navigation Buttons in Sidebar */
        #sidebar-navigation-container .bg-\[\#01A4E3\] {
            background: linear-gradient(135deg, #01A4E3 0%, #007bb0 100%) !important;
            border-left: 4px solid #00D4AA !important;
            padding-left: 0.75rem !important;
            border-radius: 6px;
        }

        /* Clean Sidebar Backdrop Blur */
        #main-sidebar {
            background: rgba(37, 37, 34, 0.8) !important;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }

        /* Top Presenter Ribbon style upgrade */
        .presenter-ribbon {
            background: rgba(22, 22, 20, 0.85) !important;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }

        /* Dynamic focus glows for input areas */
        input:focus, select:focus, textarea:focus {
            box-shadow: 0 0 10px 1px rgba(1, 164, 227, 0.2);
        }

        /* Glassmorphism panel styling for menus, search bars and metrics */
        #admin-metrics-panel,
        #screen-bandeja > div.flex-col.sm\:flex-row,
        #screen-historial > div.bg-\[\#252522\],
        #screen-gestion > div.bg-\[\#252522\] {
            background: rgba(37, 37, 34, 0.6) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border-color: rgba(58, 58, 55, 0.8) !important;
        }

        /* Clean borders on Tables */
        table th {
            letter-spacing: 0.05em;
        }
        table tr {
            transition: background-color 0.2s ease;
        }

        .sidebar-full-only {
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        /* Global font size scale up */
        body {
            font-size: 14.5px;
        }
        .text-\[8px\] { font-size: 10px !important; }
        .text-\[9px\] { font-size: 11px !important; }
        .text-\[10px\] { font-size: 12px !important; }
        .text-\[11px\] { font-size: 13px !important; }
        .text-xs { font-size: 14px !important; }
        .text-sm { font-size: 15.5px !important; }
        .text-base { font-size: 17.5px !important; }
        .text-lg { font-size: 19.5px !important; }
        .text-xl { font-size: 21.5px !important; }
        .text-2xl { font-size: 25.5px !important; }

        /* Left menu SVGs sizing and alignment */
        #sidebar-navigation-container svg {
            width: 17px !important;
            height: 17px !important;
            stroke-width: 2px !important;
        }

        /* Adjust layout margin and font size for cleaner visual flow */
        #sidebar-navigation-container button {
            font-size: 13px !important;
            margin-bottom: 0.25rem;
            padding-left: calc(0.75rem + 4px) !important;
            padding-right: 0.75rem !important;
            border-left: 0 !important;
        }
    </style>

</head>
<body class="overflow-x-hidden min-h-screen flex flex-col justify-between">

    <!-- TOP MOCKUP CONTROL DECK (Presenter ribbon to inspect all screens and states dynamically) -->
    <div class="presenter-ribbon border-b-2 border-[#01A4E3] px-6 py-2.5 sticky top-0 z-50 shadow-lg">
        <div class="w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div class="flex items-center justify-between w-full md:w-auto">
                <div class="flex items-center space-x-2">
                    <span class="text-[#8B8FA8] font-semibold">Auditoría y Roles</span>
                </div>
                <!-- Mobile Expand Toggle for Presenter Controls -->
                <button onclick="togglePresenterDeck()" class="md:hidden text-[#8B8FA8] hover:text-white px-2 py-1 border border-[#3A3A37] rounded bg-[#2E2E2B] font-bold text-[10px] active:scale-95 transition">
                    <span id="btn-presenter-toggle-text">Ver Controles</span>
                </button>
            </div>

            <!-- Quick Screen Switchers (Collapsible on mobile) -->
            <div id="presenter-buttons-deck" class="hidden md:flex flex-wrap items-center gap-1 mt-2 md:mt-0">
                <button onclick="switchScreen('login')" id="btn-login" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#F0F0F5] rounded font-medium transition">1. Login</button>
                <button onclick="switchScreen('login-reset')" id="btn-login-reset" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#F0F0F5] rounded font-medium transition">1B. Cambiar Clave</button>
                <button onclick="setRoleAndSwitch('Asesor', 'bandeja')" id="btn-bandeja-asesor" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#F0F0F5] rounded font-medium transition">2. Bandeja Asesor</button>
                <button onclick="setRoleAndSwitch('Admin', 'bandeja')" id="btn-bandeja-admin" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#F0F0F5] rounded font-medium transition">2B. Bandeja Admin</button>
                <button onclick="switchScreen('chat')" id="btn-chat" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#F0F0F5] rounded font-medium transition">3. Chat (Asesor)</button>
                <button onclick="switchScreen('gestion')" id="btn-gestion" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#F0F0F5] rounded font-medium transition">4. Gestión Asesores</button>
                <button onclick="switchScreen('specs')" id="btn-specs" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#F0F0F5] rounded font-medium transition">5. Specs</button>
                <button onclick="triggerExpiredSession()" class="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-200 rounded font-semibold transition" title="Simular sesión expirada">6. Expira Sesión</button>
                <div class="w-px h-4 bg-[#3A3A37] hidden md:block mx-0.5"></div>
                <button onclick="setRoleAndSwitch('Admin','gestion'); setTimeout(()=>toggleBehaviorAlerts(false),100)" class="screen-btn px-2 py-1 bg-[#FF5B5B]/10 hover:bg-[#FF5B5B]/20 text-[#FF5B5B] border border-[#FF5B5B]/30 rounded font-medium transition text-[10px]">Alertas datos</button>
                <button onclick="setRoleAndSwitch('Admin','gestion'); setTimeout(()=>toggleBehaviorAlerts(true),100)" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#8B8FA8] border border-[#3A3A37] rounded font-medium transition text-[10px]">Alertas vacío</button>
                <button onclick="setSidebarAlertsBadge(3)" class="px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#FF5B5B] border border-[#3A3A37] rounded font-medium transition text-[10px]">Badge 3</button>
                <button onclick="setSidebarAlertsBadge(0)" class="px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#8B8FA8] border border-[#3A3A37] rounded font-medium transition text-[10px]">Badge 0</button>
                <button onclick="switchScreen('perfil')" class="screen-btn px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#F0F0F5] rounded font-medium transition text-[10px]">Perfil+Horarios</button>
                <button onclick="switchScreen('perfil'); setTimeout(()=>setAvailability('available'),100)" class="px-2 py-1 bg-[#00D4AA]/10 hover:bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/30 rounded font-medium transition text-[10px]">Disp: Available</button>
                <button onclick="switchScreen('perfil'); setTimeout(()=>setAvailability('break'),100)" class="px-2 py-1 bg-[#FFB84D]/10 hover:bg-[#FFB84D]/20 text-[#FFB84D] border border-[#FFB84D]/30 rounded font-medium transition text-[10px]">Disp: Break</button>
                <button onclick="switchScreen('perfil'); setTimeout(()=>setAvailability('offline'),100)" class="px-2 py-1 bg-[#FF5B5B]/10 hover:bg-[#FF5B5B]/20 text-[#FF5B5B] border border-[#FF5B5B]/30 rounded font-medium transition text-[10px]">Disp: Offline</button>
                <button onclick="document.getElementById('modal-add-schedule').classList.remove('hidden')" class="px-2 py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-[#01A4E3] border border-[#01A4E3]/30 rounded font-medium transition text-[10px]">Modal Horario</button>
                <button onclick="switchScreen('chat'); simulatedChatScenario('assigned'); setTimeout(()=>document.getElementById('modal-confirm-close').classList.remove('hidden'),100)" class="px-2 py-1 bg-[#FF5B5B]/10 hover:bg-[#FF5B5B]/20 text-[#FF5B5B] border border-[#FF5B5B]/30 rounded font-medium transition text-[10px]">Modal Cerrar Conv.</button>
            </div>

            <!-- Global simulation trigger controls (Collapsible on mobile) -->
            <div id="presenter-simulation-deck" class="hidden md:flex items-center space-x-1.5 mt-2 md:mt-0">
                <button onclick="triggerNewEscalatedToast()" class="bg-[#2E2E2B] hover:bg-[#3A3A37] px-2 py-1 rounded text-[#00D4AA] flex items-center gap-1 border border-[#01A4E3]/20">
                    <span>🔔 Alerta</span>
                </button>
                <button onclick="toggleWSManualState()" class="bg-[#2E2E2B] hover:bg-[#3A3A37] px-2 py-1 rounded text-[#FFB84D] border border-[#3A3A37]" id="btn-manual-ws">
                    <span>WS: On</span>
                </button>
                <button onclick="toggleAnnotations()" class="bg-[#2E2E2B] hover:bg-[#01A4E3] px-2 py-1 rounded text-white font-bold transition">
                    <span>💡 Specs</span>
                </button>
            </div>
        </div>
    </div>

    <!-- GLOBAL WEBSOCKET CRITICAL ERROR BANNER -->
    <div id="ws-disconnected-banner" class="hidden bg-gradient-to-r from-[#FF5B5B] to-[#D64545] text-white px-6 py-3.5 text-xs font-semibold flex flex-col sm:flex-row justify-between items-center gap-3 transition-all z-[99] shadow-lg border-b border-[#FF5B5B]/30">
        <div class="flex items-center space-x-3">
            <div class="bg-white/10 p-1.5 rounded-full shrink-0">
                <svg class="w-4.5 h-4.5 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <span><strong>Se perdió la conexión en tiempo real.</strong> El canal WebSocket está inactivo y el monitoreo se encuentra en pausa. ¿Deseas reestablecer el túnel?</span>
        </div>
        <button onclick="reconnectWSWithSuccess()" class="bg-white hover:bg-slate-100 text-black font-bold px-4 py-2 rounded shadow-md hover:shadow-lg transition active:scale-95 text-[10px] uppercase tracking-wide shrink-0">Reconectar Canal</button>
    </div>

    <!-- MOBILE BACKDROP FOR THE DRAWER SIDEBAR -->
    <div id="sidebar-backdrop" onclick="toggleMobileSidebar(false)" class="fixed inset-0 bg-black/70 z-30 hidden md:hidden transition-opacity"></div>

    <!-- MAIN IMMERSIVE LAYOUT CANVAS -->
    <main class="flex-1 w-full flex relative min-h-[calc(100vh-120px)]">

        <!-- SIDEBAR IZQUIERDO FIJO (256px, colapsable a 70px, absolute en móvil) -->
        <aside id="main-sidebar" class="fixed md:relative top-0 bottom-0 left-0 w-64 bg-[#252522] border-r border-[#3A3A37] flex flex-col justify-between p-4 shrink-0 transition-transform duration-300 -translate-x-full md:translate-x-0 z-40 h-full md:h-auto">
            <div class="space-y-6">
                <!-- User Profile Card inside Sidebar -->
                <div class="flex items-center space-x-3 p-2 bg-[#2E2E2B]/50 rounded-lg border border-[#3A3A37] sidebar-full-only">
                    <div class="relative">
                        <img id="sidebar-user-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" alt="Avatar" class="w-10 h-10 rounded-full border border-[#01A4E3] object-cover">
                        <!-- Responsive Dot indicating websocket status -->
                        <div id="sidebar-ws-dot" class="absolute bottom-0 right-0 w-3 h-3 bg-[#01A4E3] rounded-full border-2 border-[#252522] ws-pulse-dot"></div>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-[#F0F0F5] truncate" id="sidebar-user-name">Diana Ospina</h4>
                        <div class="flex items-center space-x-1.5">
                            <span class="bg-[#01A4E3]/10 text-[#01A4E3] text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase" id="sidebar-user-badge" title="Asesor regular de soporte">Asesor</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation Links inside Sidebar -->
                <nav class="space-y-1.5" id="sidebar-navigation-container">
                    <button onclick="switchScreen('bandeja')" id="sidebar-nav-inbox" class="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#01A4E3] text-white rounded-md text-xs font-semibold transition">
                        <span class="flex items-center space-x-2.5">
                            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                            <span class="sidebar-full-only">Bandeja de Entrada</span>
                        </span>
                        <span class="bg-[#FF5B5B] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold sidebar-full-only" id="sidebar-badge-counter">14</span>
                    </button>

                    <button onclick="switchScreen('historial')" id="sidebar-nav-history" class="w-full flex items-center justify-between px-3.5 py-2.5 text-[#8B8FA8] hover:text-white hover:bg-[#2E2E2B]/50 rounded-md text-xs font-semibold transition">
                        <span class="flex items-center space-x-2.5">
                            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span class="sidebar-full-only">Historial Cerrados</span>
                        </span>
                        <span class="sidebar-full-only"></span>
                    </button>

                    <button onclick="switchScreen('gestion')" id="sidebar-nav-mgmt" class="hidden w-full flex items-center justify-between px-3.5 py-2.5 text-[#8B8FA8] hover:text-white hover:bg-[#2E2E2B]/50 rounded-md text-xs font-semibold transition">
                        <span class="flex items-center space-x-2.5">
                            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                            <span class="sidebar-full-only">Gestión Asesores</span>
                        </span>
                        <span id="sidebar-alerts-badge" class="hidden bg-[#FF5B5B] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold sidebar-full-only">3</span>
                    </button>

                    <button onclick="switchScreen('perfil')" id="sidebar-nav-profile" class="w-full flex items-center justify-between px-3.5 py-2.5 text-[#8B8FA8] hover:text-white hover:bg-[#2E2E2B]/50 rounded-md text-xs font-semibold transition">
                        <span class="flex items-center space-x-2.5">
                            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                            <span class="sidebar-full-only">Mi Perfil</span>
                        </span>
                        <span class="sidebar-full-only"></span>
                    </button>
                </nav>
            </div>

            <div class="mt-8 pt-4 border-t border-[#3A3A37]/60 space-y-3">
                <div class="p-2.5 bg-[#1D1D1B] rounded-lg border border-[#3A3A37] text-center sidebar-full-only">
                    <p class="text-[9px] text-[#8B8FA8] uppercase font-bold tracking-wider">Túnel WebSocket</p>
                    <div class="flex items-center justify-center gap-2 mt-1" id="sidebar-ws-status-area">
                        <span class="w-2 h-2 rounded-full bg-[#01A4E3] ws-pulse-dot inline-block"></span>
                        <span class="text-[11px] text-[#F0F0F5] font-semibold">En línea</span>
                    </div>
                </div>

                <button onclick="switchScreen('login')" class="w-full flex items-center justify-center space-x-2 px-3 py-2.5 border border-[#FF5B5B]/30 hover:border-[#FF5B5B] text-[#FF5B5B] hover:bg-[#FF5B5B]/10 rounded-md text-xs font-semibold transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    <span class="sidebar-full-only">Cerrar Sesión</span>
                </button>
            </div>
        </aside>

        <!-- CORE CONTENT RENDERING AREA -->
        <div class="flex-1 flex flex-col min-w-0 bg-[#1D1D1B]">

            <!-- MOBILE APP HEADER TRIGGER -->
            <div class="md:hidden flex items-center justify-between bg-[#252522] border-b border-[#3A3A37] px-4 py-3 shrink-0">
                <div class="flex items-center space-x-3">
                    <button onclick="toggleMobileSidebar(true)" class="text-[#8B8FA8] hover:text-white p-1 focus:outline-none" aria-label="Toggle Sidebar">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </button>
                    <span class="text-xs font-bold text-white uppercase tracking-wider" id="mobile-header-title">Bandeja</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 rounded-full bg-[#01A4E3] ws-pulse-dot"></span>
                    <span class="text-[9px] text-[#8B8FA8] uppercase font-bold" id="mobile-header-role">Asesor</span>
                </div>
            </div>

            <!-- ==================== PANTALLA 1: LOGIN ==================== -->
            <section id="screen-login" class="screen-section hidden flex-1 flex flex-col items-center justify-center py-8 px-4 relative">
                <div class="absolute top-4 left-4 bg-[#252522] border border-[#3A3A37] p-2 rounded-lg text-[10px] max-w-[200px] space-y-1 z-10">
                    <span class="text-[#FFB84D] font-bold uppercase block">Controles de Login:</span>
                    <button onclick="simulateLoginState('normal')" class="w-full py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-white rounded">Estado Normal</button>
                    <button onclick="simulateLoginState('error')" class="w-full py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-white rounded">Simular Error</button>
                    <button onclick="simulateLoginState('loading')" class="w-full py-1 bg-[#2E2E2B] hover:bg-[#3A3A37] text-white rounded">Simular Cargando...</button>
                </div>

                <div class="max-w-md w-full bg-[#252522] border border-[#3A3A37] rounded-xl p-6 sm:p-8 shadow-2xl relative annotation-spec" data-annotation="Card centrado de login. Se bloquea la opción de registro según reglas corporativas.">
                    <div class="text-center mb-6">
                        <div class="inline-flex items-center justify-center bg-[#2E2E2B] p-3 rounded-xl border border-[#3A3A37] mb-3">
                            <svg class="w-10 h-10 text-[#01A4E3]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H14V14H10V21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M10 3V5C10 5.55228 10.4477 6 11 6H13C13.5523 6 14 5.55228 14 5V3" stroke="currentColor" stroke-width="1.8"/>
                            </svg>
                        </div>
                        <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Casas y Espacios <span class="text-[#01A4E3]">Agent</span></h2>
                        <p class="text-xs text-[#8B8FA8] mt-1.5">Panel de Atención — Acceso exclusivo para el equipo</p>
                    </div>

                    <form onsubmit="event.preventDefault(); switchScreen('login-reset');" class="space-y-4">
                        <div class="relative flex items-center">
                            <input type="email" id="login-email" required value="asesor.bogota@casasyespacios.co" class="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md pl-3 pr-10 pt-5 pb-1 text-xs outline-none transition duration-150 focus:ring-1 focus:ring-[#01A4E3]/30" placeholder=" " />
                            <label class="absolute text-[10px] text-[#8B8FA8] duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3]">Correo Electrónico</label>
                            <span class="absolute right-3 text-[#8B8FA8] peer-focus:text-[#01A4E3] transition-colors pointer-events-none">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            </span>
                        </div>

                        <div class="relative flex items-center">
                            <input type="password" id="login-password" required value="contraseniaSegura123" class="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md pl-3 pr-10 pt-5 pb-1 text-xs outline-none transition duration-150 focus:ring-1 focus:ring-[#01A4E3]/30" placeholder=" " />
                            <label class="absolute text-[10px] text-[#8B8FA8] duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3]">Contraseña</label>
                            <button type="button" onclick="togglePasswordVisibility('login-password')" class="absolute right-3 text-[#8B8FA8] hover:text-[#01A4E3] transition-colors" aria-label="Toggle Password Visibility">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </button>
                        </div>

                        <div id="login-error-panel" class="hidden bg-[#FF5B5B]/10 border border-[#FF5B5B] p-3 rounded-lg flex items-start space-x-2.5">
                            <svg class="w-5 h-5 text-[#FF5B5B] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            <div class="text-[11px]">
                                <span class="font-bold text-white block">Error de Credenciales</span>
                                <span class="text-[#8B8FA8]">El usuario o contraseña ingresados no pertenecen a la organización.</span>
                            </div>
                        </div>

                        <div class="flex items-center justify-between text-[11px] pt-1">
                            <label class="flex items-center space-x-2 text-[#8B8FA8] cursor-pointer">
                                <input type="checkbox" class="accent-[#01A4E3] bg-[#2E2E2B] border-[#3A3A37] rounded" checked>
                                <span>Recordar sesión</span>
                            </label>
                            <a href="#" onclick="showSystemNotification('Se ha enviado enlace de recuperación vía Supabase Auth', 'success')" class="text-[#01A4E3] hover:underline font-semibold">¿Olvidó su contraseña?</a>
                        </div>

                        <button type="submit" id="login-submit-btn" class="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white py-3.5 h-12 rounded-md font-semibold text-xs transition duration-150 flex items-center justify-center gap-2">
                            <span id="login-btn-text">Ingresar al sistema</span>
                            <span id="login-btn-spinner" class="hidden w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        </button>
                    </form>

                    <div class="mt-6 pt-4 border-t border-[#3A3A37]/60 text-center text-[10px] text-[#8B8FA8] uppercase tracking-widest font-semibold">
                        © 2026 Casas y Espacios S.A.S. — Sistema de uso interno restringido
                    </div>
                </div>
            </section>

            <!-- ==================== PANTALLA 1B: CAMBIO DE CONTRASEÑA OBLIGATORIO ==================== -->
            <section id="screen-login-reset" class="screen-section hidden flex-1 flex flex-col items-center justify-center py-8 px-4 relative">
                <div class="max-w-md w-full bg-[#252522] border border-[#3A3A37] rounded-xl p-6 sm:p-8 shadow-2xl relative annotation-spec" data-annotation="Primer acceso obligatorio para resetear contraseña temporal provista por el Admin.">
                    <div class="mb-6">
                        <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <svg class="w-5 h-5 text-[#FFB84D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            Establecer nueva contraseña
                        </h2>
                        <p class="text-xs text-[#8B8FA8] mt-1.5">Por motivos de seguridad, debes configurar una contraseña definitiva en tu primer login.</p>
                    </div>

                    <form onsubmit="event.preventDefault(); setRoleAndSwitch('Asesor', 'bandeja');" class="space-y-4">
                        <div class="relative">
                            <input type="password" id="reset-new-pwd" oninput="checkPasswordStrength(this.value)" required class="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md px-3 pt-5 pb-1 text-xs outline-none transition duration-150" placeholder=" " />
                            <label class="absolute text-[10px] text-[#8B8FA8] duration-150 top-4 left-3 origin-[0] transform -translate-y-3 scale-75 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3]">Nueva Contraseña</label>
                        </div>

                        <!-- Real-time Password Strength Indicator -->
                        <div class="space-y-1">
                            <div class="flex justify-between items-center text-[10px]">
                                <span class="text-[#8B8FA8]">Seguridad de la contraseña:</span>
                                <span id="reset-pwd-strength-txt" class="font-bold text-[#FF5B5B]">No ingresada</span>
                            </div>
                            <div class="h-1.5 w-full bg-[#2E2E2B] rounded-full overflow-hidden flex gap-0.5">
                                <div id="strength-bar-1" class="h-full w-1/3 bg-transparent transition-all"></div>
                                <div id="strength-bar-2" class="h-full w-1/3 bg-transparent transition-all"></div>
                                <div id="strength-bar-3" class="h-full w-1/3 bg-transparent transition-all"></div>
                            </div>
                        </div>

                        <div class="relative">
                            <input type="password" id="reset-confirm-pwd" required class="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md px-3 pt-5 pb-1 text-xs outline-none transition duration-150" placeholder=" " />
                            <label class="absolute text-[10px] text-[#8B8FA8] duration-150 top-4 left-3 origin-[0] transform -translate-y-3 scale-75 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3]">Confirmar Nueva Contraseña</label>
                        </div>

                        <button type="submit" class="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white py-3.5 h-12 rounded-md font-bold text-xs transition duration-150 flex items-center justify-center gap-1.5">
                            <span>Establecer contraseña y continuar</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </form>
                </div>
            </section>

            <!-- ==================== PANTALLAS 2 & 2B & 2C: BANDEJA DE CONVERSACIONES ==================== -->
            <section id="screen-bandeja" class="screen-section hidden flex-1 flex flex-col p-4 md:p-6 space-y-4">

                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3A3A37] pb-4">
                    <div>
                        <h2 class="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            Bandeja de Entrada
                            <span class="bg-[#01A4E3]/15 text-[#01A4E3] text-xs px-2.5 py-0.5 rounded-full font-bold" id="bandeja-total-counter">14 Totales</span>
                        </h2>
                        <!-- Connected Advisors indicator panel -->
                        <div class="text-[11px] text-[#8B8FA8] mt-1 flex flex-wrap items-center gap-1.5" id="connected-advisors-panel">
                          <span>En línea ahora:</span>
                          <span class="inline-flex items-center gap-1 text-white bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
                            Andrés
                            <span class="text-[#00D4AA] font-bold">1/3</span>
                          </span>
                          <span class="inline-flex items-center gap-1 text-white bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
                            Diana
                            <span class="text-[#FF5B5B] font-bold">3/3</span>
                          </span>
                          <span class="inline-flex items-center gap-1 text-[#8B8FA8] bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-zinc-600 rounded-full"></span>
                            Julio
                            <span class="text-[#8B8FA8]">Off</span>
                          </span>
                        </div>
                    </div>

                    <!-- Metrics bar (Admin visual view only) -->
                    <div id="admin-metrics-panel" class="hidden grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[#252522] p-2 border border-[#3A3A37] rounded-lg">
                        <div class="text-center px-2 py-1 border-r border-[#3A3A37]/60">
                            <span class="text-[9px] text-[#8B8FA8] font-bold block uppercase">Activas</span>
                            <span class="text-xs font-black text-white">14</span>
                        </div>
                        <div class="text-center px-2 py-1 border-r border-[#3A3A37]/60">
                            <span class="text-[9px] text-[#8B8FA8] font-bold block uppercase">Escaladas</span>
                            <span class="text-xs font-black text-[#FF5B5B]">5</span>
                        </div>
                        <div class="text-center px-2 py-1 border-r border-[#3A3A37]/60">
                            <span class="text-[9px] text-[#8B8FA8] font-bold block uppercase">Atención</span>
                            <span class="text-xs font-black text-[#FFB84D]">3</span>
                        </div>
                        <div class="text-center px-2 py-1 border-r border-[#3A3A37]/60">
                            <span class="text-[9px] text-[#8B8FA8] font-bold block uppercase">T. Promedio</span>
                            <span class="text-xs font-black text-[#00D4AA]">8 m</span>
                        </div>
                        <div class="text-center px-2 py-1 border-r border-[#3A3A37]/60">
                            <span class="text-[9px] text-[#8B8FA8] font-bold block uppercase">Bot OK</span>
                            <span class="text-xs font-black text-white">87%</span>
                        </div>
                        <div class="text-center px-2 py-1">
                            <span class="text-[9px] text-[#8B8FA8] font-bold block uppercase">Capacidad</span>
                            <span class="text-xs font-black text-[#FFB84D]">7/9</span>
                        </div>
                    </div>
                </div>

                <!-- Filters Strip -->
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#252522] p-2 border border-[#3A3A37] rounded-lg">
                    <div class="flex flex-wrap gap-1 text-xs" id="bandeja-filter-buttons-container">
                        <button class="bg-[#01A4E3] text-white px-3 py-1.5 rounded font-semibold transition flex items-center gap-1.5" onclick="filterBandejaCards('all', this)">Todas (4)</button>
                        <button class="text-[#8B8FA8] hover:text-white px-3 py-1.5 rounded font-medium transition flex items-center gap-1.5" onclick="filterBandejaCards('escalada', this)">
                            Escaladas <span class="bg-[#FF5B5B] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">2</span>
                        </button>
                        <button class="text-[#8B8FA8] hover:text-white px-3 py-1.5 rounded font-medium transition flex items-center gap-1.5" onclick="filterBandejaCards('activa', this)">Activas (2)</button>
                        <button class="text-[#8B8FA8] hover:text-white px-3 py-1.5 rounded font-medium transition flex items-center gap-1.5" onclick="filterBandejaCards('cerrada', this)">Cerradas (0)</button>
                    </div>

                    <div class="flex items-center space-x-2 w-full sm:w-auto">
                        <select onchange="filterBandejaByChannel(this.value)" class="bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-2.5 py-1.5 w-full sm:w-44 focus:border-[#01A4E3] outline-none">
                            <option value="all">Todos los Canales</option>
                            <option value="Administrativa">Administrativa</option>
                            <option value="Comercial">Comercial</option>
                        </select>
                        <button onclick="triggerNetworkSimulatedLoading()" class="bg-[#2E2E2B] hover:bg-[#3A3A37] p-1.5 rounded border border-[#3A3A37] text-[#8B8FA8] hover:text-white shrink-0 active:scale-95 transition" title="Simular Carga de Red (Skeletons)">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"/></svg>
                        </button>
                    </div>
                </div>

                <!-- CONTEXT SKELETON LOADER (Initially hidden) -->
                <div id="bandeja-skeleton" class="hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    <div class="bg-[#252522] border border-[#3A3A37] rounded-lg p-3.5 space-y-3.5 animate-pulse">
                        <div class="flex justify-between items-center"><div class="h-3 bg-[#2E2E2B] rounded w-1/4"></div><div class="h-3 bg-[#2E2E2B] rounded w-1/12"></div></div>
                        <div class="h-5 bg-[#2E2E2B] rounded w-3/4"></div>
                        <div class="h-3 bg-[#2E2E2B] rounded w-1/2"></div>
                    </div>
                    <div class="bg-[#252522] border border-[#3A3A37] rounded-lg p-3.5 space-y-3.5 animate-pulse">
                        <div class="flex justify-between items-center"><div class="h-3 bg-[#2E2E2B] rounded w-1/4"></div><div class="h-3 bg-[#2E2E2B] rounded w-1/12"></div></div>
                        <div class="h-5 bg-[#2E2E2B] rounded w-2/3"></div>
                        <div class="h-3 bg-[#2E2E2B] rounded w-1/3"></div>
                    </div>
                </div>

                <!-- HIGH DENSITY CARDS GRID (12px padding, compact layout) -->
                <div id="bandeja-real-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">

                    <!-- VARIANT A: Escalada sin asesor (URGENTE, <10 min) -->
                    <div data-filter-type="escalada" data-filter-channel="Comercial" data-assigned-to="" class="bg-[#252522] border-l-[3px] border-l-[#FF5B5B] border border-[#3A3A37] rounded-r-lg p-3 flex flex-col justify-between hover:bg-[#2E2E2B]/40 transition annotation-spec" data-annotation="Variante A: Escalada sin asesor urgente. Borde sutil rojo de 3px. Padding 12px.">
                        <div class="space-y-2">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-wrap gap-1">
                                    <span class="bg-[#FF5B5B]/15 text-[#FF5B5B] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Escalada</span>
                                    <span class="bg-[#2E2E2B] text-[#F0F0F5] text-[8px] px-1.5 py-0.5 rounded font-semibold">Propietario</span>
                                    <span class="bg-[#2E2E2B] text-[#01A4E3] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">Comercial</span>
                                </div>
                                <span class="text-[10px] text-[#8B8FA8]">hace 5 min</span>
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-white truncate" title="Carlos Mendoza Salcedo">Carlos Mendoza Salcedo</h3>
                                <p class="text-[11px] text-[#8B8FA8] mt-0.5">Motivo: <span class="font-mono text-[#F0F0F5]">frustracion_detectada</span></p>
                                <p class="text-[11px] text-[#F0F0F5]/85 italic mt-1 truncate bg-[#2E2E2B]/40 p-2 rounded border border-[#3A3A37]/40">"Llevo tres días intentando reportar un daño en el calentador..."</p>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-[#3A3A37]/60 flex items-center justify-between">
                            <span class="text-[#FF5B5B] text-[10px] font-bold flex items-center gap-1">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                Sin asignar
                            </span>
                            <button onclick="triggerAssignModal('Carlos Mendoza Salcedo', 'frustracion_detectada', '5 min')" class="btn-atender-ya bg-[#01A4E3] hover:bg-[#0190C8] text-white px-3 py-1 rounded text-[10px] font-bold transition">Atender ya</button>
                        </div>
                    </div>

                    <!-- VARIANT A2: Escalada sin asesor (CRÍTICA, >15 min) -->
                    <div data-filter-type="escalada" data-filter-channel="Administrativa" data-assigned-to="" class="bg-[#252522] border border-[#3A3A37] rounded-r-lg p-3 flex flex-col justify-between hover:bg-[#2E2E2B]/40 transition critical-pulse-card annotation-spec" data-annotation="Variante A2: Alerta crítica (>15m de espera). Pulso dinámico en borde y sombra de advertencia.">
                        <div class="space-y-2">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-wrap gap-1">
                                    <span class="bg-[#FF5B5B] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">CRÍTICO</span>
                                    <span class="bg-[#2E2E2B] text-[#F0F0F5] text-[8px] px-1.5 py-0.5 rounded font-semibold">Inquilino</span>
                                    <span class="bg-[#2E2E2B] text-[#00D4AA] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">Administrativa</span>
                                </div>
                                <span class="text-[10px] text-[#FFB84D] font-black flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    ⚠️ 18 min
                                </span>
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-white truncate" title="Fabián Sanabria Corredor">Fabián Sanabria Corredor</h3>
                                <p class="text-[11px] text-[#8B8FA8] mt-0.5">Motivo: <span class="font-mono text-[#FF5B5B] font-bold">no_clasificado</span></p>
                                <p class="text-[11px] text-[#F0F0F5]/85 italic mt-1 truncate bg-[#2E2E2B]/40 p-2 rounded border border-[#3A3A37]/40">"Me mudé ayer y el apartamento tiene humedad en la pared..."</p>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-[#3A3A37]/60 flex items-center justify-between">
                            <span class="text-[#FF5B5B] text-[10px] font-bold flex items-center gap-1">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                Sin asignar
                            </span>
                            <div class="relative group">
                              <button
                                disabled
                                class="bg-[#2E2E2B] text-[#8B8FA8] px-3 py-1 rounded text-[10px] font-bold cursor-not-allowed border border-[#3A3A37]"
                              >
                                Atender ya
                              </button>
                              <div class="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-[#1D1D1B] border border-[#3A3A37] text-[#F0F0F5] text-[10px] px-2.5 py-1.5 rounded whitespace-nowrap z-50">
                                Límite alcanzado — tienes 3 conversaciones activas
                              </div>
                            </div>
                        </div>
                    </div>

                    <!-- VARIANT B: Escalada con Asesor Asignado -->
                    <div data-filter-type="activa" data-filter-channel="Comercial" data-assigned-to="Andrés" class="bg-[#252522] border-l-[3px] border-l-[#FFB84D] border border-[#3A3A37] rounded-r-lg p-3 flex flex-col justify-between hover:bg-[#2E2E2B]/40 transition">
                        <div class="space-y-2">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-wrap gap-1">
                                    <span class="bg-[#FFB84D]/15 text-[#FFB84D] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">En Atención</span>
                                    <span class="bg-[#2E2E2B] text-[#F0F0F5] text-[8px] px-1.5 py-0.5 rounded font-semibold">Propietario</span>
                                    <span class="bg-[#2E2E2B] text-[#01A4E3] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">Comercial</span>
                                </div>
                                <span class="text-[10px] text-[#8B8FA8]">hace 12 min</span>
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-white truncate" title="Diana Milena Guerrero">Diana Milena Guerrero</h3>
                                <p class="text-[11px] text-[#8B8FA8] mt-0.5">Motivo: <span class="font-mono text-[#F0F0F5]">error_simi</span></p>
                                <p class="text-[11px] text-[#F0F0F5]/85 italic mt-1 truncate bg-[#2E2E2B]/40 p-2 rounded border border-[#3A3A37]/40">"La pasarela de pago SIMI arroja error 403..."</p>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-[#3A3A37]/60 flex items-center justify-between">
                            <div class="flex items-center space-x-1.5 overflow-hidden max-w-[70%]">
                                <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=60" alt="Asignado" class="w-4 h-4 rounded-full object-cover">
                                <span class="text-[#8B8FA8] text-[10px] truncate">Asignado: <strong class="text-white font-semibold">Andrés</strong></span>
                            </div>
                            <button onclick="switchScreen('chat'); simulatedChatScenario('assigned');" class="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[10px] font-semibold transition">Ver</button>
                        </div>
                    </div>

                    <!-- VARIANT C: Activa (Bot Respondiendo) -->
                    <div data-filter-type="activa" data-filter-channel="Administrativa" data-assigned-to="bot" class="bg-[#252522] border-l-[3px] border-l-[#00D4AA] border border-[#3A3A37] rounded-r-lg p-3 flex flex-col justify-between hover:bg-[#2E2E2B]/40 transition">
                        <div class="space-y-2">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-wrap gap-1">
                                    <span class="bg-[#00D4AA]/15 text-[#00D4AA] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Activa (Bot)</span>
                                    <span class="bg-[#2E2E2B] text-[#F0F0F5] text-[8px] px-1.5 py-0.5 rounded font-semibold">Inquilino</span>
                                </div>
                                <span class="text-[10px] text-[#8B8FA8]">hace 1 min</span>
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-white truncate" title="Julio César Gómez">Julio César Gómez</h3>
                                <p class="text-[11px] text-[#8B8FA8] mt-0.5">Último del Bot: <span class="text-[#00D4AA] font-semibold">"He recibido sus fotos..."</span></p>
                                <p class="text-[11px] text-[#F0F0F5]/85 italic mt-1 truncate bg-[#2E2E2B]/40 p-2 rounded border border-[#3A3A37]/40">"Listo, ahí le envié las fotos del recibo del agua..."</p>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-[#3A3A37]/60 flex items-center justify-between">
                            <span class="text-[#8B8FA8] flex items-center gap-1 text-[10px] truncate max-w-[70%]">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse"></span>
                                El bot está resolviendo de forma autónoma
                            </span>
                            <button onclick="switchScreen('chat'); simulatedChatScenario('bot');" class="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[10px] font-semibold transition">Ver</button>
                        </div>
                    </div>

                    <!-- VARIANT D: Activa asignada a Diana -->
                    <div data-filter-type="activa" data-filter-channel="Comercial" data-assigned-to="Diana" class="bg-[#252522] border-l-[3px] border-l-[#00D4AA] border border-[#3A3A37] rounded-r-lg p-3 flex flex-col justify-between hover:bg-[#2E2E2B]/40 transition">
                        <div class="space-y-2">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-wrap gap-1">
                                    <span class="bg-[#00D4AA]/15 text-[#00D4AA] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Activa</span>
                                    <span class="bg-[#2E2E2B] text-[#F0F0F5] text-[8px] px-1.5 py-0.5 rounded font-semibold">Propietario</span>
                                    <span class="bg-[#2E2E2B] text-[#01A4E3] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">Comercial</span>
                                </div>
                                <span class="text-[10px] text-[#8B8FA8]">hace 4 min</span>
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-white truncate" title="Laura Rojas Ortiz">Laura Rojas Ortiz</h3>
                                <p class="text-[11px] text-[#8B8FA8] mt-0.5">Último mensaje: <span class="text-white">"Me interesa el apartamento..."</span></p>
                                <p class="text-[11px] text-[#F0F0F5]/85 italic mt-1 truncate bg-[#2E2E2B]/40 p-2 rounded border border-[#3A3A37]/40">"Hola, vi la publicación en Finca Raíz y quisiera programar visita."</p>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-[#3A3A37]/60 flex items-center justify-between">
                            <div class="flex items-center space-x-1.5 overflow-hidden max-w-[70%]">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60" alt="Asignado" class="w-4 h-4 rounded-full object-cover">
                                <span class="text-[#8B8FA8] text-[10px] truncate">Asignado: <strong class="text-white font-semibold">Diana</strong></span>
                            </div>
                            <button onclick="switchScreen('chat'); simulatedChatScenario('assigned');" class="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[10px] font-semibold transition">Ver</button>
                        </div>
                    </div>

                    <!-- VARIANT E: Escalada asignada a Diana -->
                    <div data-filter-type="escalada" data-filter-channel="Comercial" data-assigned-to="Diana" class="bg-[#252522] border-l-[3px] border-l-[#FF5B5B] border border-[#3A3A37] rounded-r-lg p-3 flex flex-col justify-between hover:bg-[#2E2E2B]/40 transition">
                        <div class="space-y-2">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-wrap gap-1">
                                    <span class="bg-[#FF5B5B]/15 text-[#FF5B5B] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Escalada</span>
                                    <span class="bg-[#2E2E2B] text-[#F0F0F5] text-[8px] px-1.5 py-0.5 rounded font-semibold">Inquilino</span>
                                    <span class="bg-[#2E2E2B] text-[#01A4E3] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">Comercial</span>
                                </div>
                                <span class="text-[10px] text-[#8B8FA8]">hace 10 min</span>
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-white truncate" title="Felipe Tobón">Felipe Tobón</h3>
                                <p class="text-[11px] text-[#8B8FA8] mt-0.5">Motivo: <span class="font-mono text-[#F0F0F5]">desacuerdo_canon</span></p>
                                <p class="text-[11px] text-[#F0F0F5]/85 italic mt-1 truncate bg-[#2E2E2B]/40 p-2 rounded border border-[#3A3A37]/40">"El incremento del arriendo del 10% no coincide con el contrato..."</p>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-[#3A3A37]/60 flex items-center justify-between">
                            <div class="flex items-center space-x-1.5 overflow-hidden max-w-[70%]">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60" alt="Asignado" class="w-4 h-4 rounded-full object-cover">
                                <span class="text-[#8B8FA8] text-[10px] truncate">Asignado: <strong class="text-white font-semibold">Diana</strong></span>
                            </div>
                            <button onclick="switchScreen('chat'); simulatedChatScenario('assigned');" class="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[10px] font-semibold transition">Ver</button>
                        </div>
                    </div>

                    <!-- VARIANT F: Activa asignada a Andrés -->
                    <div data-filter-type="activa" data-filter-channel="Administrativa" data-assigned-to="Andrés" class="bg-[#252522] border-l-[3px] border-l-[#00D4AA] border border-[#3A3A37] rounded-r-lg p-3 flex flex-col justify-between hover:bg-[#2E2E2B]/40 transition">
                        <div class="space-y-2">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-wrap gap-1">
                                    <span class="bg-[#00D4AA]/15 text-[#00D4AA] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Activa</span>
                                    <span class="bg-[#2E2E2B] text-[#F0F0F5] text-[8px] px-1.5 py-0.5 rounded font-semibold">Inquilino</span>
                                    <span class="bg-[#2E2E2B] text-[#00D4AA] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">Administrativa</span>
                                </div>
                                <span class="text-[10px] text-[#8B8FA8]">hace 15 min</span>
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-white truncate" title="Esteban Quito">Esteban Quito</h3>
                                <p class="text-[11px] text-[#8B8FA8] mt-0.5">Último mensaje: <span class="text-white">"Envío comprobante de pago..."</span></p>
                                <p class="text-[11px] text-[#F0F0F5]/85 italic mt-1 truncate bg-[#2E2E2B]/40 p-2 rounded border border-[#3A3A37]/40">"Ya realicé la transferencia para el canon de este mes."</p>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-[#3A3A37]/60 flex items-center justify-between">
                            <div class="flex items-center space-x-1.5 overflow-hidden max-w-[70%]">
                                <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=60" alt="Asignado" class="w-4 h-4 rounded-full object-cover">
                                <span class="text-[#8B8FA8] text-[10px] truncate">Asignado: <strong class="text-white font-semibold">Andrés</strong></span>
                            </div>
                            <button onclick="switchScreen('chat'); simulatedChatScenario('assigned');" class="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[10px] font-semibold transition">Ver</button>
                        </div>
                    </div>

                    <!-- EMPTY STATE CARD FOR FILTERING -->
                    <div id="bandeja-empty-state" class="hidden col-span-full bg-[#252522] border border-[#3A3A37] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 max-w-md mx-auto w-full mt-4">
                        <div class="bg-[#2E2E2B] w-12 h-12 rounded-full flex items-center justify-center text-[#01A4E3] border border-[#3A3A37]">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <div>
                            <h4 class="text-sm font-bold text-white">No hay conversaciones</h4>
                            <p class="text-xs text-[#8B8FA8] mt-1 leading-relaxed">
                                No se encontraron chats que coincidan con este filtro.
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            <!-- ==================== PANTALLA 3: VISTA DE CHAT ==================== -->
            <section id="screen-chat" class="screen-section hidden flex-1 flex flex-col lg:flex-row relative">

                <!-- Chat Feed central column (flex-1) -->
                <div class="flex-1 flex flex-col bg-[#1D1D1B] border-r border-[#3A3A37] min-w-0">
                    <!-- Chat View Header -->
                    <div class="bg-[#252522] p-3 border-b border-[#3A3A37] flex justify-between items-center shrink-0">
                        <div class="flex items-center space-x-2">
                            <button onclick="switchScreen('bandeja')" class="flex items-center gap-1 px-2.5 py-1.5 bg-[#2E2E2B] hover:bg-[#3A3A37] border border-[#3A3A37] rounded text-xs font-semibold text-[#8B8FA8] hover:text-white transition">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                                <span class="hidden sm:inline">Volver</span>
                            </button>
                            <div>
                                <h3 class="text-xs font-bold text-white flex items-center gap-1.5">
                                    Carlos Mendoza
                                    <span class="w-1.5 h-1.5 rounded-full bg-[#FF5B5B] inline-block" id="chat-header-status-dot"></span>
                                </h3>
                                <p class="text-[9px] text-[#8B8FA8]">WhatsApp ID: ARR-4592 • Espera: <span class="text-[#FF5B5B] font-bold">5 min</span></p>
                            </div>
                        </div>

                        <!-- Read-only Monitoring dynamic banner -->
                        <div id="monitoring-mode-pill" class="hidden bg-[#FFB84D]/15 text-[#FFB84D] text-[10px] px-2.5 py-1 rounded font-black border border-[#FFB84D]/30 items-center gap-1 animate-pulse">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            <span>Monitoreo</span>
                        </div>

                        <!-- Mobile Toggle Details Button -->
                        <button onclick="toggleChatRightAside(true)" class="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-[#2E2E2B] hover:bg-[#3A3A37] border border-[#3A3A37] rounded text-xs font-semibold text-[#8B8FA8] hover:text-white transition">
                            <svg class="w-4 h-4 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span>Detalles</span>
                        </button>
                    </div>

                    <!-- Chat Message Feed (Anclado al último mensaje) -->
                    <div class="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col h-[55vh] md:h-[calc(100vh-280px)]" id="chat-message-feed">

                        <!-- Skeleton loading simulator internally -->
                        <div id="chat-skeleton" class="hidden space-y-3 animate-pulse">
                            <div class="flex flex-col items-start max-w-[70%] space-y-1">
                                <div class="h-10 bg-[#2E2E2B] rounded-xl w-60"></div>
                            </div>
                            <div class="flex flex-col items-end max-w-[70%] self-end space-y-1">
                                <div class="h-8 bg-[#1F2937] rounded-xl w-40"></div>
                            </div>
                        </div>

                        <div class="text-center my-1 shrink-0">
                            <span class="bg-[#252522] text-[#8B8FA8] text-[9px] px-2.5 py-1 rounded-full border border-[#3A3A37]">Hoy, 11 de Junio</span>
                        </div>

                        <!-- Customer Inbound message -->
                        <div class="flex flex-col items-start max-w-[80%] space-y-1 shrink-0">
                            <div class="bg-[#2E2E2B] text-[#F0F0F5] text-xs p-3 rounded-lg rounded-tl-none leading-relaxed">
                                Hola, buenas tardes. Necesito urgente que me colaboren con el daño de mi calentador de agua. Es de gas de paso y tiene una fuga de agua abajo.
                            </div>
                            <span class="text-[9px] text-[#8B8FA8] ml-1">15:01 • Cliente</span>
                        </div>

                        <!-- Bot Outbound message -->
                        <div class="flex flex-col items-end max-w-[80%] self-end space-y-1 shrink-0">
                            <div class="bg-[#1F2937] text-[#F0F0F5] text-xs p-3 rounded-lg rounded-tr-none leading-relaxed border border-[#3A3A37]">
                                <div class="flex items-center space-x-1 text-[#00D4AA] font-bold text-[9px] uppercase mb-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    <span>Bot Asistente</span>
                                </div>
                                Para procesar tu reporte, por favor confírmame el código de inmueble o la dirección del apartamento en el que resides actualmente.
                            </div>
                            <span class="text-[9px] text-[#8B8FA8] mr-1">15:01</span>
                        </div>

                        <!-- Customer Inbound frustrated message -->
                        <div class="flex flex-col items-start max-w-[80%] space-y-1 shrink-0">
                            <div class="bg-[#2E2E2B] text-[#F0F0F5] text-xs p-3 rounded-lg rounded-tl-none leading-relaxed">
                                Es en la Calle 145 #12-45 Apto 502, el contrato está a nombre de Carlos Mendoza. Llevo tres días reportando esto por aquí y el robot me responde lo mismo. ¡Estoy frustrado de bañarme con agua helada y tener el piso inundado!
                            </div>
                            <span class="text-[9px] text-[#8B8FA8] ml-1">15:02 • Cliente</span>
                        </div>

                        <!-- Imagen enviada por el cliente (inbound) -->
                        <div class="flex flex-col items-start max-w-[80%] space-y-1 shrink-0">
                          <div class="bg-[#2E2E2B] rounded-lg rounded-tl-none overflow-hidden border border-[#3A3A37]">
                            <div class="w-48 h-32 bg-[#3A3A37] flex items-center justify-center">
                              <svg class="w-8 h-8 text-[#8B8FA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                            </div>
                            <p class="text-[#F0F0F5] text-xs p-2">Foto del daño en el calentador</p>
                          </div>
                          <span class="text-[9px] text-[#8B8FA8] ml-1">14:58 • Cliente</span>
                        </div>

                        <!-- Documento enviado por el asesor (outbound_advisor) -->
                        <div class="flex flex-col items-end max-w-[80%] self-end space-y-1 shrink-0">
                          <div class="bg-[#01A4E3] rounded-lg rounded-tr-none p-3 flex items-center gap-3">
                            <div class="w-8 h-8 bg-white/20 rounded flex items-center justify-center shrink-0">
                              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                              </svg>
                            </div>
                            <div>
                              <p class="text-white text-xs font-semibold">orden_reparacion_4592.pdf</p>
                              <p class="text-white/70 text-[10px]">PDF • 180 KB</p>
                            </div>
                            <button class="text-white/80 hover:text-white ml-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                              </svg>
                            </button>
                          </div>
                          <span class="text-[9px] text-[#8B8FA8] mr-1">15:05 • Diana Ospina</span>
                        </div>

                        <!-- Escalation System Event Tag -->
                        <div class="text-center my-2 shrink-0">
                            <span class="bg-[#FF5B5B]/10 text-[#FF5B5B] text-[9px] font-bold px-2.5 py-1 rounded border border-[#FF5B5B]/30 inline-flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                Conversación escalada por IA: frustracion_detectada
                            </span>
                        </div>

                        <!-- Returned to Bot dynamic System event tag -->
                        <div id="event-returned-bot" class="hidden text-center my-2 shrink-0">
                            <span class="bg-[#00D4AA]/10 text-[#00D4AA] text-[9px] font-bold px-2.5 py-1 rounded border border-[#00D4AA]/30 inline-flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse"></span>
                                Conversación devuelta al bot de forma autónoma
                            </span>
                        </div>

                        <!-- Dynamic Real-time Typing Status Feed Indicator -->
                        <div id="advisor-typing-feed-indicator" class="hidden flex items-center space-x-2 text-[10px] text-[#8B8FA8] italic py-1 shrink-0">
                            <span class="flex space-x-1 items-center justify-center">
                                <span class="h-1.5 w-1.5 bg-[#8B8FA8] rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                                <span class="h-1.5 w-1.5 bg-[#8B8FA8] rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                                <span class="h-1.5 w-1.5 bg-[#8B8FA8] rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                            </span>
                            <span id="typing-indicator-name">Diana Ospina está redactando...</span>
                        </div>

                    </div>

                    <!-- Text Inputs operational console -->
                    <div class="p-3 bg-[#252522] border-t border-[#3A3A37] shrink-0 space-y-2">

                        <!-- CONTEXT RESTRICTION BAR (Required constraint) -->
                        <div class="bg-[#2E2E2B]/60 px-3 py-1.5 border border-[#3A3A37] rounded flex flex-wrap justify-between items-center text-[10px] sm:text-[11px] text-[#8B8FA8]" id="chat-context-restriction-bar">
                            <div class="flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#01A4E3]"></span>
                                <span>Respondiendo a: <strong class="text-white" id="context-bar-client-name">Carlos Mendoza</strong></span>
                            </div>
                            <div class="text-[#FFB84D] flex items-center gap-1 font-semibold">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#FFB84D] animate-pulse"></span>
                                <span>⚠️ Esperando respuesta hace 8 m</span>
                            </div>
                        </div>

                        <!-- INLINE POST FAIL MESSAGE -->
                        <div id="chat-send-error-banner" class="hidden flex items-center justify-between p-3 bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 rounded-lg text-xs text-[#FF5B5B] shadow-md animate-pulse">
                            <span class="flex items-center gap-2">
                                <svg class="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                <span>No pudimos enviar el mensaje a través de Meta API. Revisa tu conexión a internet o reintenta de nuevo.</span>
                            </span>
                            <button onclick="resendFailedChatMessage()" class="shrink-0 ml-3 bg-[#FF5B5B]/20 hover:bg-[#FF5B5B]/40 text-[#FF5B5B] px-3 py-1.5 rounded font-bold text-[10px] uppercase border border-[#FF5B5B]/30 transition active:scale-95">Reintentar</button>
                        </div>

                        <!-- Preview del archivo seleccionado -->
                        <div id="file-preview-bar" class="hidden flex items-center justify-between p-2 bg-[#252522] border border-[#3A3A37] rounded text-xs">
                          <div class="flex items-center gap-2.5">
                            <!-- Ícono dinámico según tipo: imagen=azul, documento=amarillo, video=verde -->
                            <div id="file-preview-icon" class="w-8 h-8 rounded bg-[#01A4E3]/15 border border-[#01A4E3]/30 flex items-center justify-center text-[#01A4E3]">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                            </div>
                            <div>
                              <p class="text-white font-semibold" id="file-preview-name">contrato_arrendamiento.pdf</p>
                              <p class="text-[#8B8FA8] text-[10px]" id="file-preview-size">245 KB • PDF</p>
                            </div>
                          </div>
                          <button onclick="removeSelectedFile()" class="text-[#8B8FA8] hover:text-[#FF5B5B] transition p-1 rounded hover:bg-[#FF5B5B]/10">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>

                        <!-- Typing input area structure -->
                        <div class="relative flex items-start bg-[#2E2E2B] border border-[#3A3A37] rounded focus-within:border-[#01A4E3] transition p-2 gap-2" id="chat-input-typing-area">

                          <!-- Botón adjuntar archivo -->
                          <div class="relative shrink-0">
                            <button
                              type="button"
                              onclick="toggleAttachMenu()"
                              class="p-2 text-[#8B8FA8] hover:text-white hover:bg-[#3A3A37] rounded transition"
                              title="Adjuntar archivo"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                              </svg>
                            </button>

                            <!-- Dropdown menu de tipos de adjunto -->
                            <div id="attach-menu" class="hidden absolute bottom-full left-0 mb-2 bg-[#252522] border border-[#3A3A37] rounded-lg shadow-xl z-50 w-44 overflow-hidden">
                              <button onclick="triggerFileInput('image')" class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition">
                                <svg class="w-4 h-4 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <span>Imagen</span>
                                <span class="text-[#8B8FA8] text-[10px] ml-auto">JPG, PNG</span>
                              </button>
                              <button onclick="triggerFileInput('document')" class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition border-t border-[#3A3A37]">
                                <svg class="w-4 h-4 text-[#FFB84D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                </svg>
                                <span>Documento</span>
                                <span class="text-[#8B8FA8] text-[10px] ml-auto">PDF, DOCX</span>
                              </button>
                              <button onclick="triggerFileInput('video')" class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition border-t border-[#3A3A37]">
                                <svg class="w-4 h-4 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                </svg>
                                <span>Video</span>
                                <span class="text-[#8B8FA8] text-[10px] ml-auto">MP4</span>
                              </button>
                            </div>
                          </div>

                          <!-- Input de texto -->
                          <textarea
                            id="chat-text-area-input"
                            onfocus="toggleLiveTypingStatus(true)"
                            onblur="toggleLiveTypingStatus(false)"
                            onkeyup="updateLiveCharCounter(this)"
                            placeholder="Escribe tu respuesta... (Enter para enviar, Shift+Enter para nueva línea)"
                            class="flex-1 bg-transparent outline-none border-none text-xs text-white placeholder-[#8B8FA8] resize-none h-11 px-1 py-1 max-h-32"
                          ></textarea>

                          <div class="flex items-center space-x-2 pl-2 border-l border-[#3A3A37] shrink-0">
                            <span id="chat-char-counter" class="text-[10px] text-[#8B8FA8] font-mono">0/2000</span>
                            <button
                              onclick="sendChatMessageSimulated()"
                              class="bg-[#01A4E3] hover:bg-[#0190C8] active:scale-95 text-white p-2 rounded transition flex items-center justify-center"
                            >
                              <svg class="w-3.5 h-3.5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                              </svg>
                            </button>
                          </div>
                        </div>

                        <!-- Warnings -->
                        <div id="chat-banner-readonly" class="hidden p-2.5 bg-[#2E2E2B] text-center border border-[#3A3A37] rounded text-xs text-[#FFB84D] font-semibold">
                            ⚠️ Modo de Solo Lectura • Debes tomar la conversación para responder.
                        </div>
                        <div id="chat-banner-bot" class="hidden p-2.5 bg-[#00D4AA]/10 text-center border border-[#00D4AA]/30 rounded text-xs text-[#00D4AA] font-semibold">
                            🤖 El bot retomó esta conversación de forma autónoma.
                        </div>
                    </div>
                </div>

                <!-- MOBILE ASIDE BACKDROP -->
                <div id="chat-aside-backdrop" onclick="toggleChatRightAside(false)" class="fixed inset-0 bg-black/75 z-30 hidden transition-opacity lg:hidden"></div>

                <!-- RIGHT DOCK (Client details and high priority AI summary) -->
                <aside id="chat-right-aside" class="hidden lg:flex fixed lg:relative top-0 bottom-0 right-0 w-80 lg:w-[320px] bg-[#252522] border-l border-[#3A3A37] p-4 space-y-4 overflow-y-auto shrink-0 flex-col justify-between h-full lg:h-auto z-40 transition-transform duration-300">
                    <div class="space-y-4">

                        <!-- Mobile Close button inside Drawer -->
                        <div class="lg:hidden flex justify-between items-center pb-2 border-b border-[#3A3A37]">
                            <span class="text-xs font-bold text-white uppercase tracking-wider">Ficha de Información</span>
                            <button onclick="toggleChatRightAside(false)" class="text-[#8B8FA8] hover:text-white p-1">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <!-- HIGH PRIORITY AI ESCALATION SUMMARY -->
                        <div class="bg-[#FF5B5B]/5 border-2 border-[#FF5B5B] rounded-lg p-3.5 space-y-3 shadow-lg annotation-spec" data-annotation="Jerarquía Visual Elevada: Resumen semántico IA destacado con borde de color según gravedad.">
                            <div class="flex items-center justify-between text-[#FF5B5B] font-black uppercase text-[10px] tracking-wider">
                                <span class="flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-full bg-[#FF5B5B] animate-ping"></span>
                                    <span>⚠️ ANÁLISIS DE ESCALADO IA</span>
                                </span>
                            </div>

                            <div class="space-y-2 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] text-[#8B8FA8] uppercase font-bold">Diagnóstico:</span>
                                    <span class="bg-[#FF5B5B]/15 text-[#FF5B5B] px-2 py-0.5 rounded text-[9px] font-mono font-bold">frustracion_detectada</span>
                                </div>
                                <div class="bg-[#1D1D1B] p-2.5 rounded border border-[#3A3A37]">
                                    <p class="text-white font-semibold leading-relaxed text-[11.5px]" id="ai-summary-text-box">
                                        El cliente presenta alta molestia (enojo) tras 3 días sin agua caliente. Reporta fuga parcial inundando el piso. El robot no logró clasificar la dirección correctamente.
                                    </p>
                                </div>
                                <div class="flex justify-between text-[9px] text-[#8B8FA8] pt-1">
                                    <span>Escalado hace: <strong class="text-white">5 minutos</strong></span>
                                    <span>ID: ESC-489</span>
                                </div>
                            </div>
                        </div>

                        <!-- Customer Details Card -->
                        <div class="bg-[#2E2E2B]/30 border border-[#3A3A37] rounded-lg p-3 space-y-3">
                            <div class="flex items-center space-x-3 pb-2 border-b border-[#3A3A37]">
                                <div class="w-10 h-10 rounded bg-[#01A4E3]/25 text-[#01A4E3] font-bold text-base flex items-center justify-center" id="detail-customer-avatar">CM</div>
                                <div>
                                    <h4 class="text-xs font-bold text-white" id="detail-customer-name">Carlos Mendoza</h4>
                                    <span class="bg-[#01A4E3]/15 text-[#01A4E3] text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-extrabold">Inquilino</span>
                                </div>
                            </div>

                            <div class="space-y-2 text-xs">
                                <div class="flex justify-between"><span class="text-[#8B8FA8]">Celular:</span><span class="text-white font-mono text-[11px]">+57 312 456 7890</span></div>
                                <div class="flex justify-between"><span class="text-[#8B8FA8]">Cédula/NIT:</span><span class="text-white font-mono text-[11px]">1.020.456.789</span></div>
                                <div class="flex justify-between"><span class="text-[#8B8FA8]">Contrato No:</span><span class="text-[#00D4AA] font-mono font-bold text-[11px]">ARR-4592</span></div>
                                <div class="flex justify-between"><span class="text-[#8B8FA8]">Dirección:</span><span class="text-white truncate max-w-[150px] text-[11px]">Calle 145 #12-45 Apto 502</span></div>
                            </div>
                        </div>

                    </div>

                    <!-- Column action button controls -->
                    <div class="space-y-2 mt-4 lg:mt-0" id="chat-actions-container">
                        <button onclick="triggerTomarConfirmModal()" class="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white py-3 px-3 h-12 rounded text-xs font-bold transition flex items-center justify-center gap-2" id="btn-action-take">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            <span>Tomar Conversación</span>
                        </button>

                        <button onclick="triggerDevolverConfirmModal()" class="hidden w-full bg-[#FF5B5B]/10 hover:bg-[#FF5B5B]/20 border border-[#FF5B5B]/30 hover:border-[#FF5B5B] text-[#FF5B5B] py-3 px-3 h-12 rounded text-xs font-bold transition flex items-center justify-center gap-2" id="btn-action-release">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            <span>Devolver al Bot</span>
                        </button>

                        <!-- Botón Cerrar Conversación -->
                        <button id="btn-close-conversation" onclick="document.getElementById('modal-confirm-close').classList.remove('hidden')" class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#FF5B5B]/20 text-[#FF5B5B]/60 hover:border-[#FF5B5B]/40 hover:text-[#FF5B5B]/80 rounded-lg text-xs font-semibold transition">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          Cerrar conversación
                        </button>
                    </div>
                </aside>
            </section>

            <!-- ==================== PANTALLA 8: HISTORIAL DE CHATS CERRADOS ==================== -->
            <section id="screen-historial" class="screen-section hidden flex-1 flex flex-col items-start p-4 md:p-6 space-y-4">
                <div class="max-w-5xl w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A3A37] pb-4">
                    <div>
                        <h2 class="text-xl font-bold text-white">Historial de Conversaciones Cerradas</h2>
                        <p class="text-xs text-[#8B8FA8]">Busca, audita y analiza transcripciones de requerimientos finalizados</p>
                    </div>
                    <button onclick="showSystemNotification('Exportando historial en CSV...', 'success')" class="bg-[#2E2E2B] hover:bg-[#3A3A37] border border-[#3A3A37] text-[#F0F0F5] px-4 py-2.5 h-11 rounded text-xs font-semibold flex items-center gap-2 transition active:scale-95">
                        <svg class="w-4 h-4 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        <span>Exportar CSV</span>
                    </button>
                </div>

                <!-- History Filtering Panel -->
                <div class="max-w-5xl w-full bg-[#252522] p-4 border border-[#3A3A37] rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div class="relative sm:col-span-2">
                        <input type="text" id="history-search-input" onkeyup="filterHistoryDynamic()" placeholder="Buscar por cliente, cédula..." class="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:border-[#01A4E3]">
                        <svg class="w-4 h-4 text-[#8B8FA8] absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <div>
                        <select id="history-filter-line" onchange="filterHistoryDynamic()" class="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded-lg p-2 outline-none focus:border-[#01A4E3]">
                            <option value="todos">Todas las Líneas</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Administrativa">Administrativa</option>
                        </select>
                    </div>
                    <div>
                        <select id="history-filter-date" onchange="filterHistoryDynamic()" class="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded-lg p-2 outline-none focus:border-[#01A4E3]">
                            <option value="todos">Cualquier Fecha</option>
                            <option value="hoy">Hoy</option>
                            <option value="semana">Últimos 7 días</option>
                        </select>
                    </div>
                </div>

                <!-- History Table wrapped in overflow container for mobile responsiveness -->
                <div class="max-w-5xl w-full bg-[#252522] border border-[#3A3A37] rounded-xl overflow-x-auto">
                    <table class="w-full text-left text-xs text-[#F0F0F5]" id="history-table">
                        <thead class="bg-[#2E2E2B]/60 border-b border-[#3A3A37] text-[#8B8FA8] uppercase tracking-wider font-semibold">
                            <tr>
                                <th class="p-4 whitespace-nowrap">Cliente</th>
                                <th class="p-4 whitespace-nowrap">Línea</th>
                                <th class="p-4 whitespace-nowrap">Fecha de Cierre</th>
                                <th class="p-4 whitespace-nowrap">Motivo / Resolución</th>
                                <th class="p-4 whitespace-nowrap">Resolutor</th>
                                <th class="p-4 text-center whitespace-nowrap">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#3A3A37]" id="history-table-body">
                            <tr class="hover:bg-[#2E2E2B]/30 transition" data-line="Comercial" data-date="hoy">
                                <td class="p-4 font-bold text-white history-client-name whitespace-nowrap truncate max-w-[150px]" title="Mariana Restrepo">Mariana Restrepo</td>
                                <td class="p-4"><span class="bg-[#01A4E3]/10 text-[#01A4E3] text-[9px] px-2 py-0.5 rounded font-black uppercase">Comercial</span></td>
                                <td class="p-4 text-[#8B8FA8] whitespace-nowrap">Hoy, 09:12 AM</td>
                                <td class="p-4 italic text-zinc-300 max-w-[200px] truncate">Duplicado de factura enviado por email.</td>
                                <td class="p-4 text-[#00D4AA] font-bold whitespace-nowrap">Diana Ospina</td>
                                <td class="p-4 text-center whitespace-nowrap"><button onclick="viewArchivedChat('Mariana Restrepo', 'Comercial')" class="text-[#01A4E3] hover:underline font-bold px-2 py-1">Auditar</button></td>
                            </tr>
                            <tr class="hover:bg-[#2E2E2B]/30 transition" data-line="Administrativa" data-date="semana">
                                <td class="p-4 font-bold text-white history-client-name whitespace-nowrap truncate max-w-[150px]" title="Gonzalo Pérez">Gonzalo Pérez</td>
                                <td class="p-4"><span class="bg-[#00D4AA]/10 text-[#00D4AA] text-[9px] px-2 py-0.5 rounded font-black uppercase">Administrativa</span></td>
                                <td class="p-4 text-[#8B8FA8] whitespace-nowrap">Ayer, 18:30 PM</td>
                                <td class="p-4 italic text-zinc-300 max-w-[200px] truncate">Daño de gas radicado en SIMI CRM con radicado #9834.</td>
                                <td class="p-4 text-[#00D4AA] font-bold whitespace-nowrap">Andrés Castro</td>
                                <td class="p-4 text-center whitespace-nowrap"><button onclick="viewArchivedChat('Gonzalo Pérez', 'Administrativa')" class="text-[#01A4E3] hover:underline font-bold px-2 py-1">Auditar</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- ==================== PANTALLA 4: GESTIÓN DE ASESORES ==================== -->
            <section id="screen-gestion" class="screen-section hidden flex-1 flex flex-col items-start p-4 md:p-6 space-y-6">
                <!-- Header -->
                <div class="max-w-5xl w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A3A37] pb-4">
                    <div>
                        <h2 class="text-xl font-bold text-white">Gestión de Asesores Operativos</h2>
                        <p class="text-xs text-[#8B8FA8]">Configura accesos, permisos y áreas en tiempo real para el equipo técnico</p>
                    </div>

                    <div class="flex items-center gap-3">
                        <span id="mgmt-admin-only-badge" class="hidden bg-[#FF5B5B]/15 text-[#FF5B5B] text-[10px] px-2.5 py-1.5 rounded font-black border border-[#FF5B5B]/30 tracking-wide" title="Acceso completo — puede atender y gestionar usuarios">🔑 ADMIN</span>
                        <button onclick="openModal('new-advisor')" class="bg-[#01A4E3] hover:bg-[#0190C8] text-white px-4 py-2.5 h-11 rounded text-xs font-bold transition flex items-center gap-2 active:scale-95">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                            <span>Crear Nuevo</span>
                        </button>
                    </div>
                </div>

                <!-- Search and Filters Panel -->
                <div class="max-w-5xl w-full bg-[#252522] p-4 border border-[#3A3A37] rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="relative w-full md:w-80">
                        <input type="text" id="advisor-search" onkeyup="filterAdvisorsDynamic()" placeholder="Buscar por nombre o email..." class="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:border-[#01A4E3]">
                        <svg class="w-4 h-4 text-[#8B8FA8] absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>

                    <div class="flex flex-wrap gap-2 w-full md:w-auto">
                        <select id="filter-advisor-role" onchange="filterAdvisorsDynamic()" class="bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-3 py-2 outline-none flex-1 md:flex-none">
                            <option value="todos">Todos los Roles</option>
                            <option value="Asesor">Asesor</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <select id="filter-advisor-area" onchange="filterAdvisorsDynamic()" class="bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-3 py-2 outline-none flex-1 md:flex-none">
                            <option value="todos">Todas las Áreas</option>
                            <option value="Administrativa">Administrativa</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Ambas">Ambas Áreas</option>
                        </select>
                    </div>
                </div>

                <!-- Dynamic Advisor Table wrapped in scroll container -->
                <div class="max-w-5xl w-full bg-[#252522] border border-[#3A3A37] rounded-xl overflow-x-auto">
                    <table class="w-full text-left text-xs text-[#F0F0F5]" id="advisors-table">
                        <thead class="bg-[#2E2E2B]/60 border-b border-[#3A3A37] text-[#8B8FA8] uppercase tracking-wider font-semibold">
                            <tr>
                                <th class="p-4 whitespace-nowrap">Nombre Completo</th>
                                <th class="p-4 whitespace-nowrap">Rol</th>
                                <th class="p-4 whitespace-nowrap">Área</th>
                                <th class="p-4">Límite Conv.</th>
                                <th class="p-4 whitespace-nowrap">Estado Cuenta</th>
                                <th class="p-4 text-center whitespace-nowrap">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#3A3A37]">

                            <!-- Row 1 -->
                            <tr class="hover:bg-[#2E2E2B]/30 transition" data-role="Asesor" data-area="Administrativa">
                                <td class="p-4 flex items-center space-x-3 whitespace-nowrap">
                                    <div class="w-8 h-8 rounded-full bg-[#2E2E2B] text-white flex items-center justify-center font-bold">AC</div>
                                    <div>
                                        <p class="font-bold text-white row-name truncate max-w-[150px]" title="Andrés Castro">Andrés Castro</p>
                                        <p class="text-[10px] text-[#8B8FA8] row-email truncate max-w-[180px]" title="andres.castro@casasyespacios.co">andres.castro@casasyespacios.co</p>
                                    </div>
                                </td>
                                <td class="p-4 whitespace-nowrap">
                                    <span class="bg-[#01A4E3]/10 text-[#01A4E3] border border-[#01A4E3]/20 text-[9px] px-2 py-0.5 rounded font-black uppercase">Asesor</span>
                                </td>
                                <td class="p-4 whitespace-nowrap">
                                    <span class="bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 text-[9px] px-2 py-0.5 rounded font-black uppercase">Administrativa</span>
                                </td>
                                <td class="p-4">
                                  <div class="flex items-center gap-2">
                                    <span class="text-white font-bold text-xs">3</span>
                                    <span class="text-[#8B8FA8] text-[10px]">máx.</span>
                                  </div>
                                </td>
                                <td class="p-4 whitespace-nowrap">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked onchange="toggleAdvisorStateWithModal('Andrés Castro', this)">
                                        <div class="w-9 h-5 bg-[#2E2E2B] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#01A4E3] peer-checked:after:bg-white"></div>
                                        <span class="ml-2 text-[10px] text-[#00D4AA] font-bold">Activo</span>
                                    </label>
                                </td>
                                <td class="p-4 text-center whitespace-nowrap">
                                    <button onclick="triggerEditAdvisorModal('Andrés Castro', 'andres.castro@casasyespacios.co', 'Asesor', 'Administrativa')" class="text-[#01A4E3] hover:underline font-bold text-[11px] px-2 py-1">Editar</button>
                                </td>
                            </tr>

                            <!-- Row 2 -->
                            <tr class="hover:bg-[#2E2E2B]/30 transition" data-role="Asesor" data-area="Comercial">
                                <td class="p-4 flex items-center space-x-3 whitespace-nowrap">
                                    <div class="w-8 h-8 rounded-full bg-[#2E2E2B] text-white flex items-center justify-center font-bold">DO</div>
                                    <div>
                                        <p class="font-bold text-white row-name truncate max-w-[150px]" title="Diana Ospina">Diana Ospina</p>
                                        <p class="text-[10px] text-[#8B8FA8] row-email truncate max-w-[180px]" title="diana.ospina@casasyespacios.co">diana.ospina@casasyespacios.co</p>
                                    </div>
                                </td>
                                <td class="p-4 whitespace-nowrap">
                                    <span class="bg-[#01A4E3]/10 text-[#01A4E3] border border-[#01A4E3]/20 text-[9px] px-2 py-0.5 rounded font-black uppercase">Asesor</span>
                                </td>
                                <td class="p-4 whitespace-nowrap">
                                    <span class="bg-[#01A4E3]/10 text-[#01A4E3] border border-[#01A4E3]/20 text-[9px] px-2 py-0.5 rounded font-black uppercase font-bold">Comercial</span>
                                </td>
                                <td class="p-4">
                                  <div class="flex items-center gap-2">
                                    <span class="text-white font-bold text-xs">3</span>
                                    <span class="text-[#8B8FA8] text-[10px]">máx.</span>
                                  </div>
                                </td>
                                <td class="p-4 whitespace-nowrap">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked onchange="toggleAdvisorStateWithModal('Diana Ospina', this)">
                                        <div class="w-9 h-5 bg-[#2E2E2B] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#01A4E3] peer-checked:after:bg-white"></div>
                                        <span class="ml-2 text-[10px] text-[#00D4AA] font-bold">Activo</span>
                                    </label>
                                </td>
                                <td class="p-4 text-center whitespace-nowrap">
                                    <button onclick="triggerEditAdvisorModal('Diana Ospina', 'diana.ospina@casasyespacios.co', 'Asesor', 'Comercial')" class="text-[#01A4E3] hover:underline font-bold text-[11px] px-2 py-1">Editar</button>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>

                <!-- ALERTAS DE COMPORTAMIENTO -->
                <div class="mt-6 max-w-5xl w-full bg-[#252522] border border-[#3A3A37] rounded-xl p-5" id="behavior-alerts-section">
                  <!-- Header -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div class="flex items-center gap-2.5">
                      <h3 class="text-sm font-bold text-white">Alertas de Comportamiento</h3>
                      <span id="alerts-badge-count" class="bg-[#FF5B5B] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">3</span>
                    </div>
                    <div class="flex gap-2">
                      <select class="bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-2.5 py-1.5 focus:border-[#01A4E3] outline-none">
                        <option value="">Todos los asesores</option>
                        <option>Andrés Castro</option>
                        <option>Diana Ospina</option>
                      </select>
                      <select class="bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-2.5 py-1.5 focus:border-[#01A4E3] outline-none">
                        <option value="">Todas las severidades</option>
                        <option>Alta</option>
                        <option>Media</option>
                        <option>Baja</option>
                      </select>
                    </div>
                  </div>

                  <!-- Lista de alertas -->
                  <div id="alerts-list" class="space-y-3">
                    <!-- Alerta 1: Alta -->
                    <div class="bg-[#2E2E2B] border border-[#3A3A37] rounded-lg p-4">
                      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                          <div class="flex flex-wrap items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-white">Andrés Castro</span>
                            <span class="bg-[#FF5B5B]/15 text-[#FF5B5B] text-[9px] px-2 py-0.5 rounded font-bold">lenguaje_inapropiado</span>
                            <span class="bg-[#FF5B5B]/15 text-[#FF5B5B] text-[9px] px-2 py-0.5 rounded font-bold uppercase">Alta</span>
                          </div>
                          <p class="text-[11px] text-[#F0F0F5]/80 italic font-mono bg-[#1D1D1B] px-3 py-2 rounded border border-[#3A3A37]/50 mb-2">"Le dije que se callara porque ya me tiene harto con las mismas quejas..."</p>
                          <span class="text-[10px] text-[#8B8FA8]">Hoy, 10:23 AM</span>
                        </div>
                        <div class="flex gap-2 shrink-0">
                          <button onclick="switchScreen('chat')" class="px-3 py-1.5 border border-[#01A4E3] text-[#01A4E3] hover:bg-[#01A4E3]/10 rounded text-[10px] font-semibold transition">Ver conversación</button>
                          <button class="px-3 py-1.5 border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#8B8FA8] rounded text-[10px] font-semibold transition">Marcar revisada</button>
                        </div>
                      </div>
                    </div>

                    <!-- Alerta 2: Media -->
                    <div class="bg-[#2E2E2B] border border-[#3A3A37] rounded-lg p-4">
                      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                          <div class="flex flex-wrap items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-white">Diana Ospina</span>
                            <span class="bg-[#FFB84D]/15 text-[#FFB84D] text-[9px] px-2 py-0.5 rounded font-bold">tono_agresivo</span>
                            <span class="bg-[#FFB84D]/15 text-[#FFB84D] text-[9px] px-2 py-0.5 rounded font-bold uppercase">Media</span>
                          </div>
                          <p class="text-[11px] text-[#F0F0F5]/80 italic font-mono bg-[#1D1D1B] px-3 py-2 rounded border border-[#3A3A37]/50 mb-2">"Si no entiende lo que le explico no sé qué más decirle, lea bien..."</p>
                          <span class="text-[10px] text-[#8B8FA8]">Ayer, 3:47 PM</span>
                        </div>
                        <div class="flex gap-2 shrink-0">
                          <button onclick="switchScreen('chat')" class="px-3 py-1.5 border border-[#01A4E3] text-[#01A4E3] hover:bg-[#01A4E3]/10 rounded text-[10px] font-semibold transition">Ver conversación</button>
                          <button class="px-3 py-1.5 border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#8B8FA8] rounded text-[10px] font-semibold transition">Marcar revisada</button>
                        </div>
                      </div>
                    </div>

                    <!-- Alerta 3: Baja -->
                    <div class="bg-[#2E2E2B] border border-[#3A3A37] rounded-lg p-4">
                      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                          <div class="flex flex-wrap items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-white">Andrés Castro</span>
                            <span class="bg-[#8B8FA8]/15 text-[#8B8FA8] text-[9px] px-2 py-0.5 rounded font-bold">comportamiento_inadecuado</span>
                            <span class="bg-[#8B8FA8]/15 text-[#8B8FA8] text-[9px] px-2 py-0.5 rounded font-bold uppercase">Baja</span>
                          </div>
                          <p class="text-[11px] text-[#F0F0F5]/80 italic font-mono bg-[#1D1D1B] px-3 py-2 rounded border border-[#3A3A37]/50 mb-2">"Bueno, como usted quiera, total a mí no me importa si firma o no..."</p>
                          <span class="text-[10px] text-[#8B8FA8]">Hace 2 días</span>
                        </div>
                        <div class="flex gap-2 shrink-0">
                          <button onclick="switchScreen('chat')" class="px-3 py-1.5 border border-[#01A4E3] text-[#01A4E3] hover:bg-[#01A4E3]/10 rounded text-[10px] font-semibold transition">Ver conversación</button>
                          <button class="px-3 py-1.5 border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#8B8FA8] rounded text-[10px] font-semibold transition">Marcar revisada</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Estado vacío (oculto por defecto) -->
                  <div id="alerts-empty-state" class="hidden flex flex-col items-center justify-center py-10 gap-3">
                    <div class="w-12 h-12 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/30 flex items-center justify-center">
                      <svg class="w-6 h-6 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <p class="text-sm font-semibold text-white">No hay alertas pendientes</p>
                    <p class="text-xs text-[#8B8FA8]">No hay alertas pendientes de revisión</p>
                  </div>
                </div>
            </section>

            <!-- ==================== PANTALLA 5: PERFIL DEL ASESOR ==================== -->
            <section id="screen-perfil" class="screen-section hidden flex-1 flex flex-col items-start p-4 md:p-6 space-y-6">
                <div class="max-w-xl w-full space-y-6">
                    <h2 class="text-xl font-bold text-white">Mi Perfil Profesional</h2>

                    <!-- Personal Information block -->
                    <div class="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 space-y-6">
                        <div class="flex flex-col sm:flex-row items-center gap-5">
                            <div class="relative group">
                                <img id="perfil-avatar-img" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" alt="Avatar Usuario" class="w-20 h-20 rounded-full border-2 border-[#01A4E3] object-cover">
                                <button class="absolute bottom-0 right-0 bg-[#01A4E3] hover:bg-[#0190C8] text-white p-1.5 rounded-full transition shadow-lg" aria-label="Change Avatar">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                </button>
                            </div>
                            <div class="text-center sm:text-left space-y-1">
                                <div class="flex items-center justify-center sm:justify-start gap-1.5">
                                    <input type="text" id="perfil-name" value="Diana Ospina Guerrero" class="bg-transparent border-b border-transparent hover:border-[#3A3A37] focus:border-[#01A4E3] outline-none text-base font-bold text-white pb-0.5 max-w-[200px]">
                                    <svg class="w-4 h-4 text-[#8B8FA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                </div>
                                <p class="text-xs text-[#8B8FA8] flex items-center justify-center sm:justify-start gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                    <span id="perfil-email-txt">diana.ospina@casasyespacios.co</span>
                                </p>
                                <div class="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                                    <span id="perfil-role-badge" class="bg-[#01A4E3]/10 text-[#01A4E3] text-[10px] px-2 py-0.5 rounded font-black uppercase">Asesor Senior</span>
                                    <span id="perfil-area-badge" class="bg-[#3A3A37] text-[#8B8FA8] text-[10px] px-2 py-0.5 rounded font-bold cursor-help" title="Solo el admin puede cambiar esto">Área: Comercial</span>
                                </div>

                                <!-- Mi Disponibilidad -->
                                <div class="mt-4 pt-4 border-t border-[#3A3A37]">
                                  <h4 class="text-xs font-bold text-white mb-3">Mi Disponibilidad</h4>

                                  <!-- Estado actual -->
                                  <div id="availability-status-display" class="flex items-center gap-2 mb-3">
                                    <span id="avail-dot" class="w-2.5 h-2.5 rounded-full bg-[#00D4AA]"></span>
                                    <span id="avail-label" class="text-xs font-semibold text-[#00D4AA]">Disponible</span>
                                  </div>

                                  <!-- Pill buttons -->
                                  <div class="flex flex-wrap gap-2 mb-3">
                                    <button id="avail-btn-available" onclick="setAvailability('available')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/40 transition">
                                      <span class="w-2 h-2 rounded-full bg-[#00D4AA]"></span>Disponible
                                    </button>
                                    <button id="avail-btn-break" onclick="setAvailability('break')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-[#3A3A37] text-[#8B8FA8] hover:border-[#FFB84D]/40 hover:text-[#FFB84D] transition">
                                      <span>&#9646;</span>En descanso
                                    </button>
                                    <button id="avail-btn-offline" onclick="setAvailability('offline')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-[#3A3A37] text-[#8B8FA8] hover:border-[#FF5B5B]/40 hover:text-[#FF5B5B] transition">
                                      <span>&#10005;</span>No disponible
                                    </button>
                                  </div>

                                  <!-- Duration picker (hidden by default) -->
                                  <div id="avail-duration-picker" class="hidden">
                                    <p class="text-[11px] text-[#8B8FA8] mb-2">¿Por cuánto tiempo?</p>
                                    <div class="flex flex-wrap gap-1.5 mb-3">
                                      <button onclick="selectDuration(this)" class="avail-dur-btn px-3 py-1 rounded-full text-[10px] font-bold border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#01A4E3] transition">15 min</button>
                                      <button onclick="selectDuration(this)" class="avail-dur-btn px-3 py-1 rounded-full text-[10px] font-bold border border-[#01A4E3] text-[#01A4E3] bg-[#01A4E3]/10">30 min</button>
                                      <button onclick="selectDuration(this)" class="avail-dur-btn px-3 py-1 rounded-full text-[10px] font-bold border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#01A4E3] transition">1 hora</button>
                                      <button onclick="selectDuration(this)" class="avail-dur-btn px-3 py-1 rounded-full text-[10px] font-bold border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#01A4E3] transition">Sin límite</button>
                                    </div>
                                    <button class="bg-[#01A4E3] hover:bg-[#0190C8] text-white px-4 py-2 rounded-lg text-xs font-bold transition" onclick="showSystemNotification('Disponibilidad actualizada', 'success')">Aplicar</button>
                                  </div>
                                </div>
                            </div>
                        </div>

                        <!-- Safety change password block -->
                        <div class="border-t border-[#3A3A37] pt-6 space-y-4">
                            <h4 class="text-sm font-semibold text-white">Cambiar Contraseña Acceso</h4>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div class="space-y-1">
                                    <label class="text-[#8B8FA8] font-semibold block uppercase text-[10px] tracking-wide">Contraseña Actual</label>
                                    <input type="password" value="••••••••••••" class="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white outline-none focus:border-[#01A4E3]">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[#8B8FA8] font-semibold block uppercase text-[10px] tracking-wide">Nueva Contraseña</label>
                                    <input type="password" placeholder="Mínimo 8 caracteres" class="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white outline-none focus:border-[#01A4E3]">
                                </div>
                            </div>

                            <button onclick="showSystemNotification('¡Contraseña actualizada con éxito!', 'success')" class="bg-[#01A4E3] hover:bg-[#0190C8] text-white py-2.5 px-4 rounded text-xs font-semibold transition active:scale-95">
                                Actualizar contraseña
                            </button>
                        </div>
                    </div>

                    <!-- CARD: Intervalos de Inactividad -->
                    <div class="bg-[#252522] border border-[#3A3A37] rounded-xl p-5">
                      <div class="flex items-start justify-between mb-1">
                        <h3 class="text-sm font-bold text-white">Intervalos de Inactividad</h3>
                      </div>
                      <p class="text-xs text-[#8B8FA8] mb-4">El sistema te marcará automáticamente como <strong class="text-[#FFB84D]">En descanso</strong> durante estos intervalos</p>

                      <div class="space-y-3" id="schedule-list">
                        <!-- Intervalo 1: Almuerzo -->
                        <div class="bg-[#2E2E2B] border border-[#3A3A37] rounded-lg p-3">
                          <div class="flex items-center justify-between gap-3 flex-wrap">
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-1.5">
                                <span class="text-xs font-bold text-white">Almuerzo</span>
                                <span class="text-[10px] text-[#8B8FA8] font-mono bg-[#1D1D1B] px-2 py-0.5 rounded border border-[#3A3A37]">12:00 – 13:30</span>
                              </div>
                              <div class="flex gap-1">
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">L</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">M</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">X</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">J</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">V</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#2E2E2B] text-[#3A3A37] border border-[#3A3A37]">S</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#2E2E2B] text-[#3A3A37] border border-[#3A3A37]">D</span>
                              </div>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                              <button onclick="this.classList.toggle('bg-[#01A4E3]'); this.classList.toggle('bg-[#3A3A37]'); this.querySelector('span').classList.toggle('translate-x-4'); this.querySelector('span').classList.toggle('translate-x-0')" class="relative w-9 h-5 bg-[#01A4E3] rounded-full transition-colors duration-200 focus:outline-none">
                                <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 translate-x-4"></span>
                              </button>
                              <button class="text-[#8B8FA8] hover:text-[#FF5B5B] transition p-1" title="Eliminar intervalo">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        <!-- Intervalo 2: Descanso tarde -->
                        <div class="bg-[#2E2E2B] border border-[#3A3A37] rounded-lg p-3">
                          <div class="flex items-center justify-between gap-3 flex-wrap">
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-1.5">
                                <span class="text-xs font-bold text-white">Descanso tarde</span>
                                <span class="text-[10px] text-[#8B8FA8] font-mono bg-[#1D1D1B] px-2 py-0.5 rounded border border-[#3A3A37]">16:00 – 16:30</span>
                              </div>
                              <div class="flex gap-1">
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">L</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">M</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">X</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">J</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">V</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#01A4E3]/15 text-[#01A4E3]">S</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#2E2E2B] text-[#3A3A37] border border-[#3A3A37]">D</span>
                              </div>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                              <button onclick="this.classList.toggle('bg-[#01A4E3]'); this.classList.toggle('bg-[#3A3A37]'); this.querySelector('span').classList.toggle('translate-x-4'); this.querySelector('span').classList.toggle('translate-x-0')" class="relative w-9 h-5 bg-[#3A3A37] rounded-full transition-colors duration-200 focus:outline-none">
                                <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 translate-x-0"></span>
                              </button>
                              <button class="text-[#8B8FA8] hover:text-[#FF5B5B] transition p-1" title="Eliminar intervalo">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button onclick="document.getElementById('modal-add-schedule').classList.remove('hidden')" class="mt-4 flex items-center gap-2 px-4 py-2 border border-[#01A4E3] text-[#01A4E3] hover:bg-[#01A4E3]/10 rounded-lg text-xs font-semibold transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        Agregar intervalo
                      </button>
                    </div>
                </div>
            </section>

            <!-- ==================== PANTALLA 7: DOCUMENTACIÓN Y FLUJOS TÉCNICOS ==================== -->
            <section id="screen-specs" class="screen-section hidden p-4 md:p-6 space-y-6 overflow-y-auto">
                <div>
                    <h2 class="text-xl font-bold text-white">Documentación de Flujo y Diseño v2.2</h2>
                    <p class="text-xs text-[#8B8FA8] mt-1">Esquematización técnica de navegación, arquitectura de transiciones de estado y tokens visuales para desarrollo.</p>
                </div>

                <!-- DIAGRAMA DE NAVEGACIÓN COMPLETO (ASCII Flowchart) -->
                <div class="bg-[#252522] border border-[#3A3A37] rounded-xl p-5 space-y-3 font-mono text-[11px] leading-relaxed">
                    <h3 class="text-xs font-bold text-[#01A4E3] uppercase">1. Flujo Completo de Navegación del Sistema</h3>
                    <div class="bg-[#1D1D1B] p-4 rounded-lg border border-[#3A3A37] overflow-x-auto text-[#00D4AA]">

<pre>
Login Screen (1)
  │
  ├───[Credenciales correctas, primer login]───► Cambio Obligatorio Contraseña (1B) ──► Bandeja (Asesor)
  │
  └───[Credenciales correctas, rol admin]──────► Bandeja Admin (2B) ──────► Vista Chat Admin (Monitoreo y Control)
  │
  └───[Sesión expirada JWT]────────────────────► Sesión Expirada (6) ────► Regreso Forzado a Login (1)

Bandeja Asesor (2)
  │
  ├───[Clic en Atender ya]─────────────────────► Modal Tomar Chat (3B) ──► Chat Asignado Activo (3)
  │
  └───[Clic en Ver Asignada]───────────────────► Chat Monitoreo (3D)

Bandeja Admin (2B)
  │
  ├───[Sidebar: Equipo]────────────────────────► Gestión de Asesores (4)
  │
  └───[Monitorear Chat]────────────────────────► Vista Chat Admin (Monitoreo)
</pre>

                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- ESPECIFICACIÓN DE SPACING Y GRID -->
                    <div class="bg-[#252522] border border-[#3A3A37] rounded-xl p-4 space-y-3">
                        <h3 class="text-xs font-bold text-[#FFB84D] uppercase">2. Tokens de Spacing e Interfaz</h3>
                        <ul class="space-y-2 text-xs text-[#8B8FA8] list-disc list-inside">
                            <li><strong class="text-white">Grid Base:</strong> Multiplos de 8px (e.g. padding 12px para bandeja, gap 8px).</li>
                            <li><strong class="text-white">Bordes Redondeados:</strong> 8px para cards, modales; 6px para inputs y botones compactos.</li>
                            <li><strong class="text-white">Colores Corporativos:</strong> El azul `#01A4E3` es exclusivo para control y foco de estados primarios.</li>
                        </ul>
                    </div>

                    <!-- ESTADO VACÍO DE LA BANDEJA -->
                    <div class="bg-[#252522] border border-[#3A3A37] rounded-xl p-4 flex flex-col justify-between">
                        <h3 class="text-xs font-bold text-[#00D4AA] uppercase mb-2">3. Estado Vacío de Bandeja (Sin escalados)</h3>
                        <div class="bg-[#1D1D1B] rounded-lg p-6 border border-[#3A3A37] text-center max-w-sm mx-auto w-full">
                            <div class="bg-[#2E2E2B] w-10 h-10 rounded-full flex items-center justify-center text-[#01A4E3] mx-auto mb-3">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <h4 class="text-xs font-bold text-white">Bandeja al día</h4>
                            <p class="text-[10px] text-[#8B8FA8] mt-1 leading-relaxed">
                                El agente de IA está gestionando todas las consultas de forma autónoma.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    </main>

    <!-- ==================== SYSTEM FLOATING MODALS OVERLAYS ==================== -->
    <div id="dialog-modal-overlay" class="fixed inset-0 bg-[#1D1D1B]/90 backdrop-blur-sm hidden items-center justify-center p-4 z-[9999]">

        <!-- MODAL 3B: TOMAR CONVERSACIÓN CONFIRMATION -->
        <div id="modal-confirm-take" class="bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl p-6 max-w-md w-full hidden space-y-4">
            <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    ¿Tomar esta conversación?
                </h3>
                <p class="text-xs text-[#8B8FA8] mt-2">Te asignarás como responsable directo de la comunicación.</p>
            </div>

            <div class="p-3 bg-[#2E2E2B]/40 rounded border border-[#3A3A37] text-xs space-y-1.5">
                <p class="text-[#8B8FA8]">Cliente: <strong class="text-white" id="modal-take-client">Carlos Mendoza</strong></p>
                <p class="text-[#8B8FA8]">Motivo: <span class="font-mono text-[#FF5B5B] font-bold" id="modal-take-motive">frustracion_detectada</span></p>
                <p class="text-[#8B8FA8]">Espera acumulada: <span class="text-[#FFB84D] font-bold" id="modal-take-wait">18 min</span></p>
            </div>

            <div class="flex items-center justify-between p-2 bg-[#2E2E2B] rounded border border-[#3A3A37] text-[11px]">
              <span class="text-[#8B8FA8]">Tus conversaciones activas:</span>
              <span class="font-bold" id="modal-take-active-count">
                <span class="text-[#00D4AA]">1 de 3</span>
              </span>
            </div>

            <p class="text-[11px] text-[#8B8FA8] italic leading-relaxed">Nota: Tus compañeros de área verán que este chat está siendo atendido y se desactivarán las respuestas automáticas del bot.</p>

            <div class="pt-2 flex justify-end gap-2.5 text-xs">
                <button onclick="closeActiveModal()" class="px-4 py-2.5 bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#8B8FA8] hover:text-white rounded font-semibold transition active:scale-95">Cancelar</button>
                <button onclick="confirmTakeAndAssignChat()" class="px-4 py-2.5 bg-[#01A4E3] text-white rounded font-bold hover:bg-[#0190C8] transition active:scale-95">Confirmar</button>
            </div>
        </div>

        <!-- MODAL 3C: DEVOLVER AL BOT CONFIRMATION -->
        <div id="modal-confirm-release" class="bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl p-6 max-w-md w-full hidden space-y-4">
            <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    ¿Devolver esta conversación al bot?
                </h3>
                <p class="text-xs text-[#8B8FA8] mt-2">El agente de IA retomará el canal de WhatsApp de manera autónoma.</p>
            </div>

            <p class="text-[11px] text-[#8B8FA8] leading-relaxed">Asegúrate de haber resuelto la consulta comercial o administrativa o haber agendado el requerimiento en SIMI antes de liberar la atención.</p>

            <div class="pt-2 flex justify-end gap-2.5 text-xs">
                <button onclick="closeActiveModal()" class="px-4 py-2.5 bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#8B8FA8] hover:text-white rounded font-semibold transition active:scale-95">Cancelar</button>
                <button onclick="confirmReleaseAndReturnToBot()" class="px-4 py-2.5 bg-transparent hover:bg-[#00D4AA]/10 border border-[#00D4AA] text-[#00D4AA] rounded font-bold transition active:scale-95">Confirmar devolución</button>
            </div>
        </div>

        <!-- MODAL 4B: CREAR NUEVO ASESOR -->
        <div id="modal-new-advisor" class="bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl p-6 max-w-md w-full hidden space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-[#3A3A37]">
                <h3 class="text-sm font-bold text-white">Crear Nuevo Asesor Operativo</h3>
                <button onclick="closeActiveModal()" class="text-[#8B8FA8] hover:text-white" aria-label="Close modal">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <form class="space-y-4 text-xs" onsubmit="event.preventDefault(); simulateAddNewAdvisor();">
                <div class="space-y-1">
                    <label class="text-[#8B8FA8] block">Nombre Completo</label>
                    <input type="text" id="new-adv-name" placeholder="Ej. Juan López" required class="w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] rounded p-2 text-white outline-none">
                </div>
                <div class="space-y-1">
                    <label class="text-[#8B8FA8] block">Correo Institucional</label>
                    <input type="email" id="new-adv-email" placeholder="nombre@casasyespacios.co" required class="w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] rounded p-2 text-white outline-none">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-[#8B8FA8] block">Rol</label>
                        <select id="new-adv-role" class="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded p-2 text-white outline-none">
                            <option value="Asesor">Asesor</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-[#8B8FA8] block">Área</label>
                        <select id="new-adv-area" onchange="updateEspecialidadOptions(this.value, 'advisor-especialidad-new')" class="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded p-2 text-white outline-none">
                            <option value="Administrativa">Administrativa</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Ambas">Ambas Áreas</option>
                        </select>
                    </div>
                </div>

                <div>
                  <label class="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-1">Especialidad</label>
                  <select id="advisor-especialidad-new" class="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-3 py-2 focus:border-[#01A4E3] outline-none">
                    <option value="General">General</option>
                    <option value="Financiera">Financiera</option>
                    <option value="Mantenimiento y Contratos">Mantenimiento y Contratos</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>

                <div class="space-y-1 text-xs">
                  <label class="text-[#8B8FA8] block">Límite de conversaciones simultáneas</label>
                  <select id="new-adv-max-conv" class="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded p-2 text-white outline-none focus:border-[#01A4E3]">
                    <option value="1">1 conversación</option>
                    <option value="2">2 conversaciones</option>
                    <option value="3" selected>3 conversaciones (estándar)</option>
                    <option value="4">4 conversaciones</option>
                    <option value="5">5 conversaciones</option>
                  </select>
                </div>

                <div class="bg-[#2E2E2B]/30 p-2 border border-[#3A3A37] rounded text-[10px] text-[#FFB84D] leading-relaxed">
                    Nota: Al crear el perfil se asignará una clave temporal. El asesor deberá cambiarla obligatoriamente en su primer login.
                </div>

                <div class="pt-4 flex justify-end gap-2 text-xs">
                    <button type="button" onclick="closeActiveModal()" class="px-4 py-2 bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#8B8FA8] hover:text-white rounded active:scale-95">Cancelar</button>
                    <button type="submit" class="px-4 py-2 bg-[#01A4E3] text-white rounded font-bold hover:bg-[#0190C8] transition active:scale-95">Crear asesor</button>
                </div>
            </form>
        </div>

        <!-- MODAL 4C: EDITAR ASESOR -->
        <div id="modal-edit-advisor" class="bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl p-6 max-w-md w-full hidden space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-[#3A3A37]">
                <h3 class="text-sm font-bold text-white">Editar Asesor Operativo</h3>
                <button onclick="closeActiveModal()" class="text-[#8B8FA8] hover:text-white" aria-label="Close modal">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <form class="space-y-4 text-xs" onsubmit="event.preventDefault(); simulateEditAdvisorSave();">
                <div class="space-y-1">
                    <label class="text-[#8B8FA8] block">Nombre Completo</label>
                    <input type="text" id="edit-adv-name" required class="w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] rounded p-2 text-white outline-none">
                </div>
                <div class="space-y-1">
                    <label class="text-[#8B8FA8] block">Correo Institucional (Solo Lectura)</label>
                    <div class="relative flex items-center">
                        <input type="email" id="edit-adv-email" readonly class="w-full bg-[#2E2E2B]/40 border border-[#3A3A37] rounded p-2 text-[#8B8FA8] outline-none pr-8 cursor-not-allowed">
                        <svg class="w-4 h-4 text-[#8B8FA8] absolute right-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-[#8B8FA8] block">Rol</label>
                        <select id="edit-adv-role" class="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded p-2 text-white outline-none">
                            <option value="Asesor">Asesor</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-[#8B8FA8] block">Área</label>
                        <select id="edit-adv-area" onchange="updateEspecialidadOptions(this.value, 'advisor-especialidad-edit')" class="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded p-2 text-white outline-none">
                            <option value="Administrativa">Administrativa</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Ambas">Ambas Áreas</option>
                        </select>
                    </div>
                </div>

                <div>
                  <label class="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-1">Especialidad</label>
                  <select id="advisor-especialidad-edit" class="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-3 py-2 focus:border-[#01A4E3] outline-none">
                    <option value="General">General</option>
                    <option value="Financiera">Financiera</option>
                    <option value="Mantenimiento y Contratos">Mantenimiento y Contratos</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>

                <div class="space-y-1 text-xs">
                  <label class="text-[#8B8FA8] block">Límite de conversaciones simultáneas</label>
                  <div class="flex items-center gap-3">
                    <select id="edit-adv-max-conv" class="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded p-2 text-white outline-none focus:border-[#01A4E3]">
                      <option value="1">1 conversación</option>
                      <option value="2">2 conversaciones</option>
                      <option value="3" selected>3 conversaciones (estándar)</option>
                      <option value="4">4 conversaciones</option>
                      <option value="5">5 conversaciones</option>
                    </select>
                  </div>
                  <p class="text-[10px] text-[#8B8FA8]">Define cuántas conversaciones escaladas puede atender este asesor al mismo tiempo.</p>
                </div>

                <div class="pt-4 flex justify-end gap-2 text-xs">
                    <button type="button" onclick="closeActiveModal()" class="px-4 py-2 bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#8B8FA8] hover:text-white rounded active:scale-95">Cancelar</button>
                    <button type="submit" class="px-4 py-2 bg-[#01A4E3] text-white rounded font-bold hover:bg-[#0190C8] transition active:scale-95">Guardar cambios</button>
                </div>
            </form>
        </div>

        <!-- MODAL 4D: DEACTIVATE WARNING -->
        <div id="modal-deactivate-warning" class="bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl p-6 max-w-sm w-full hidden space-y-4">
            <div class="text-center">
                <div class="bg-[#FFB84D]/10 text-[#FFB84D] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#FFB84D]/35">
                    <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3 class="text-sm font-bold text-white" id="deactivate-modal-title">¿Desactivar Asesor?</h3>
                <p class="text-xs text-[#8B8FA8] mt-2 leading-relaxed" id="deactivate-modal-desc">
                    Este asesor tiene conversaciones asignadas activas. Al desactivarlo, los chats serán liberados y quedarán sin asesor asignado.
                </p>
            </div>

            <div class="pt-2 flex flex-col gap-2 text-xs">
                <button onclick="confirmDeactivateAdvisorAndRelease()" class="w-full bg-[#FF5B5B] hover:bg-red-600 text-white py-2.5 rounded font-bold transition active:scale-95">
                    Desactivar de todas formas
                </button>
                <button onclick="cancelDeactivationWithRevert()" class="w-full bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#8B8FA8] py-2.5 rounded font-semibold transition active:scale-95">
                    Cancelar Acción
                </button>
            </div>
        </div>

        <!-- PANTALLA 6: SESIÓN EXPIRADA GLOBAL MODAL (Lockout) -->
        <div id="modal-expired-session" class="bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl p-6 max-w-sm w-full hidden space-y-4 annotation-spec" data-annotation="Modal global locked (Pantalla 6) bloqueando la UI al expirar sesión JWT de Supabase.">
            <div class="text-center">
                <div class="bg-red-950/40 text-[#FF5B5B] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#FF5B5B]/30">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h3 class="text-sm font-bold text-white">Tu sesión ha expirado</h3>
                <p class="text-xs text-[#8B8FA8] mt-2 leading-relaxed">
                    Por seguridad, tu sesión se cerró automáticamente. Ingresa nuevamente para continuar.
                </p>
            </div>

            <div class="pt-2 text-xs">
                <button onclick="forceReturnToLoginAfterExpired()" class="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white py-2.5 rounded font-bold transition active:scale-95">
                    Ir al login
                </button>
            </div>
        </div>

    </div>

    <!-- ==================== SYSTEM TOAST NOTIFICATIONS ==================== -->

    <!-- Toast for New Escalated Chats (Esquina superior derecha) with simulated audio bell -->
    <div id="new-escalated-toast" class="fixed top-24 right-4 bg-[#252522] border-l-4 border-l-[#FF5B5B] border border-[#3A3A37] rounded-r-lg shadow-2xl p-3.5 w-80 translate-x-[400px] transition-transform duration-300 ease-out z-[999] pointer-events-auto">
        <div class="flex items-start gap-3">
            <div class="bg-[#FF5B5B]/10 p-2 rounded-lg text-[#FF5B5B] shrink-0">
                <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <div class="flex-1 text-xs">
                <div class="flex justify-between items-start">
                    <h5 class="font-bold text-white flex items-center gap-1">
                        Nueva Escalación 🔔
                    </h5>
                    <button onclick="closeNewEscalatedToast()" class="text-[#8B8FA8] hover:text-white" aria-label="Close toast">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <p class="text-[11px] text-[#8B8FA8] mt-1">Cliente: <strong class="text-white">Fabián Sanabria Corredor</strong></p>
                <p class="text-[11px] text-[#8B8FA8]">Motivo: <span class="text-[#FF5B5B] font-mono font-bold">no_clasificado</span></p>
                <div class="mt-2.5 flex justify-end gap-2 text-[10px]">
                    <button onclick="closeNewEscalatedToast()" class="px-2 py-1 hover:bg-[#2E2E2B] text-[#8B8FA8] rounded font-bold">Ignorar</button>
                    <button onclick="goToEscalatedChatFromToast()" class="bg-[#01A4E3] text-white px-2.5 py-1 rounded font-bold hover:bg-[#0190C8] transition active:scale-95">Atender ya</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Global success or informational operation toaster (Dismiss in 4 seconds) -->
    <div id="operation-success-toast" class="fixed top-24 right-4 bg-[#252522] border-l-4 border-l-[#00D4AA] border border-[#3A3A37] rounded-r-lg shadow-2xl p-3.5 w-80 translate-x-[400px] transition-transform duration-300 ease-out z-[999] pointer-events-auto flex items-start gap-3">
        <div class="bg-[#00D4AA]/10 p-2 rounded-lg text-[#00D4AA] shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="flex-1 text-xs">
            <h5 class="font-bold text-white" id="success-toast-title">Operación Exitosa</h5>
            <p class="text-[11px] text-[#8B8FA8] mt-1" id="success-toast-desc">Cambios guardados en sistema.</p>
        </div>
    </div>

    <!-- ==================== CLIENT INTERACTION ENGINE (JS) ==================== -->
    <script>
        // System wide layout variables
        let currentRole = 'Asesor'; // Default presentation role
        let currentActiveScreen = 'bandeja';
        let annotationsEnabled = false;

        // Custom action state triggers
        let targetDeactivateAdvisorName = null;
        let activeDeactivateCheckboxEl = null;
        let selectedTakeClientName = "Carlos Mendoza Salcedo";
        let selectedTakeMotive = "frustracion_detectada";
        let selectedTakeWait = "5 min";

        // WebSocket Simulator state helper: 0=Connected, 1=Reconnecting, 2=Disconnected
        let wsSimulatedState = 0;

        // Auto Scroll controller for the chat
        function scrollChatToBottom() {
            const feed = document.getElementById('chat-message-feed');
            if (feed) {
                setTimeout(() => {
                    feed.scrollTop = feed.scrollHeight;
                }, 50);
            }
        }

        // --- PASSWORD STRENGTH REAL-TIME ESTIMATION ---
        function checkPasswordStrength(val) {
            const label = document.getElementById('reset-pwd-strength-txt');
            const b1 = document.getElementById('strength-bar-1');
            const b2 = document.getElementById('strength-bar-2');
            const b3 = document.getElementById('strength-bar-3');

            b1.className = "h-full w-1/3 bg-transparent transition-all";
            b2.className = "h-full w-1/3 bg-transparent transition-all";
            b3.className = "h-full w-1/3 bg-transparent transition-all";

            if (val.length === 0) {
                label.innerText = "No ingresada";
                label.className = "font-bold text-[#FF5B5B]";
                return;
            }

            if (val.length < 6) {
                label.innerText = "Débil";
                label.className = "font-bold text-[#FF5B5B]";
                b1.classList.add('bg-[#FF5B5B]');
            } else if (val.length >= 6 && val.length < 10) {
                label.innerText = "Media";
                label.className = "font-bold text-[#FFB84D]";
                b1.classList.add('bg-[#FFB84D]');
                b2.classList.add('bg-[#FFB84D]');
            } else {
                label.innerText = "Fuerte";
                label.className = "font-bold text-[#00D4AA]";
                b1.classList.add('bg-[#00D4AA]');
                b2.classList.add('bg-[#00D4AA]');
                b3.classList.add('bg-[#00D4AA]');
            }
        }

        // Toggle password character visibility
        function togglePasswordVisibility(id) {
            const el = document.getElementById(id);
            if (el.type === 'password') {
                el.type = 'text';
            } else {
                el.type = 'password';
            }
        }

        // --- SCREEN AND ROLE PRESENTER CONTROL FLOW ---
        function setRoleAndSwitch(role, screenId) {
            currentRole = role;

            // Adjust sidebar presentation visual cues
            const userBadge = document.getElementById('sidebar-user-badge');
            const userNavMgmt = document.getElementById('sidebar-nav-mgmt');
            const inboxBadgeCounter = document.getElementById('sidebar-badge-counter');
            const userName = document.getElementById('sidebar-user-name');
            const userAvatar = document.getElementById('sidebar-user-avatar');
            const adminBadge = document.getElementById('mgmt-admin-only-badge');

            // Synchronize profile details based on active role
            const profileName = document.getElementById('perfil-name');
            const profileEmail = document.getElementById('perfil-email-txt');
            const profileRole = document.getElementById('perfil-role-badge');
            const profileArea = document.getElementById('perfil-area-badge');
            const profileAvatarImg = document.getElementById('perfil-avatar-img');

            // Connected advisors customized list based on active role
            const advisorsPanel = document.getElementById('connected-advisors-panel');

            // Mobile header sync
            const mobileHeaderRole = document.getElementById('mobile-header-role');
            if (mobileHeaderRole) {
                mobileHeaderRole.innerText = role;
            }

            if (role === 'Admin') {
                if (userName) userName.innerText = "Julio César Gómez";
                if (userAvatar) userAvatar.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60";
                if (adminBadge) adminBadge.classList.remove('hidden');
                userBadge.innerText = "Admin 🔑";
                userBadge.className = "bg-[#FF5B5B]/15 text-[#FF5B5B] text-[9px] px-1.5 py-0.2 rounded font-black uppercase cursor-help";
                userBadge.setAttribute('title', 'Acceso completo — puede atender, monitorear y gestionar usuarios');
                userNavMgmt.classList.remove('hidden');
                inboxBadgeCounter.innerText = "ADMIN";
                inboxBadgeCounter.className = "bg-[#FF5B5B]/20 text-[#FF5B5B] text-[8px] px-1.5 py-0.5 rounded font-black uppercase";

                // Show metrics panel for Admin now!
                document.getElementById('admin-metrics-panel').classList.remove('hidden');

                document.querySelectorAll('.btn-atender-ya').forEach(btn => {
                    btn.innerText = "Atender ya";
                    btn.className = "btn-atender-ya bg-[#01A4E3] hover:bg-[#0190C8] text-white px-3 py-1 rounded text-[10px] font-bold transition";
                });

                if (profileName) profileName.value = "Julio César Gómez";
                if (profileEmail) profileEmail.innerText = "julio.gomez@casasyespacios.co";
                if (profileRole) {
                    profileRole.innerText = "Administrador Global";
                    profileRole.className = "bg-[#FF5B5B]/15 text-[#FF5B5B] text-[10px] px-2 py-0.5 rounded font-black uppercase";
                }
                if (profileArea) profileArea.innerText = "Área: Ambas Áreas (Admin)";
                if (profileAvatarImg) profileAvatarImg.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80";

                if (advisorsPanel) {
                    advisorsPanel.innerHTML = `
                        <span>En línea ahora:</span>
                        <span class="inline-flex items-center gap-1 text-white bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
                            Andrés
                            <span class="text-[#00D4AA] font-bold">1/3</span>
                        </span>
                        <span class="inline-flex items-center gap-1 text-white bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
                            Diana
                            <span class="text-[#FF5B5B] font-bold">3/3</span>
                        </span>
                        <span class="inline-flex items-center gap-1 text-[#8B8FA8] bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
                            Julio (Admin)
                            <span class="text-[#00D4AA] font-bold">0/3</span>
                        </span>
                    `;
                }

            } else {
                if (userName) userName.innerText = "Diana Ospina";
                if (userAvatar) userAvatar.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60";
                if (adminBadge) adminBadge.classList.add('hidden');
                userBadge.innerText = "Asesor";
                userBadge.className = "bg-[#01A4E3]/10 text-[#01A4E3] text-[9px] px-1.5 py-0.2 rounded font-black uppercase";
                userBadge.removeAttribute('title');
                userNavMgmt.classList.add('hidden');
                inboxBadgeCounter.innerText = "14";
                inboxBadgeCounter.className = "bg-[#FF5B5B] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold";
                document.getElementById('admin-metrics-panel').classList.add('hidden');

                document.querySelectorAll('.btn-atender-ya').forEach(btn => {
                    btn.innerText = "Atender ya";
                    btn.className = "btn-atender-ya bg-[#01A4E3] hover:bg-[#0190C8] text-white px-3 py-1 rounded text-[10px] font-bold transition";
                });

                if (profileName) profileName.value = "Diana Ospina Guerrero";
                if (profileEmail) profileEmail.innerText = "diana.ospina@casasyespacios.co";
                if (profileRole) {
                    profileRole.innerText = "Asesor Senior";
                    profileRole.className = "bg-[#01A4E3]/10 text-[#01A4E3] text-[10px] px-2 py-0.5 rounded font-black uppercase";
                }
                if (profileArea) profileArea.innerText = "Área: Comercial";
                if (profileAvatarImg) profileAvatarImg.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";

                if (advisorsPanel) {
                    advisorsPanel.innerHTML = `
                        <span>En línea ahora:</span>
                        <span class="inline-flex items-center gap-1 text-white bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
                            Andrés
                            <span class="text-[#00D4AA] font-bold">1/3</span>
                        </span>
                        <span class="inline-flex items-center gap-1 text-white bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
                            Diana
                            <span class="text-[#FF5B5B] font-bold">3/3</span>
                        </span>
                        <span class="inline-flex items-center gap-1 text-[#8B8FA8] bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
                            <span class="w-1.5 h-1.5 bg-zinc-600 rounded-full"></span>
                            Julio
                            <span class="text-[#8B8FA8]">Off</span>
                        </span>
                    `;
                }
            }

            applyBandejaFilters();
            switchScreen(screenId);
        }

        // Global screen rendering control
        function switchScreen(screenId) {
            // Hide all sections first
            document.querySelectorAll('.screen-section').forEach(section => {
                section.classList.add('hidden');
            });

            // Show target
            const target = document.getElementById(`screen-${screenId}`);
            if (target) {
                target.classList.remove('hidden');
            }

            // Sync navigation active buttons accurately
            document.querySelectorAll('#sidebar-navigation-container button').forEach(btn => {
                btn.className = "w-full flex items-center justify-between px-3.5 py-2.5 text-[#8B8FA8] hover:text-white hover:bg-[#2E2E2B]/50 rounded-md text-xs font-semibold transition";
            });

            // Sync Header Titles for Mobile
            const mTitle = document.getElementById('mobile-header-title');
            if (mTitle) {
                if (screenId === 'bandeja') mTitle.innerText = "Bandeja";
                else if (screenId === 'historial') mTitle.innerText = "Historial";
                else if (screenId === 'gestion') mTitle.innerText = "Equipo";
                else if (screenId === 'perfil') mTitle.innerText = "Perfil";
                else if (screenId === 'chat') mTitle.innerText = "Chat";
                else mTitle.innerText = "Agent";
            }

            // Adjust highlighting specifically
            if (screenId === 'bandeja') {
                const activeInbox = document.getElementById('sidebar-nav-inbox');
                if (activeInbox) activeInbox.className = "w-full flex items-center justify-between px-3.5 py-2.5 bg-[#01A4E3] text-white rounded-md text-xs font-semibold transition";
            } else if (screenId === 'historial') {
                const activeHistory = document.getElementById('sidebar-nav-history');
                if (activeHistory) activeHistory.className = "w-full flex items-center justify-between px-3.5 py-2.5 bg-[#01A4E3] text-white rounded-md text-xs font-semibold transition";
            } else if (screenId === 'gestion') {
                const activeMgmt = document.getElementById('sidebar-nav-mgmt');
                if (activeMgmt) activeMgmt.className = "w-full flex items-center justify-between px-3.5 py-2.5 bg-[#01A4E3] text-white rounded-md text-xs font-semibold transition";
            } else if (screenId === 'perfil') {
                const activeProfile = document.getElementById('sidebar-nav-profile');
                if (activeProfile) activeProfile.className = "w-full flex items-center justify-between px-3.5 py-2.5 bg-[#01A4E3] text-white rounded-md text-xs font-semibold transition";
            }

            // Trigger autoscroll inside Chat sections
            if (screenId === 'chat') {
                scrollChatToBottom();
            }

            // Auto close mobile sidebar after navigation to prevent covering content
            toggleMobileSidebar(false);

            currentActiveScreen = screenId;
            updateAnnotationsView();
        }

        // --- CHAT SCENARIO CONTROLS ---
        function simulatedChatScenario(scenario) {
            const takeBtn = document.getElementById('btn-action-take');
            const releaseBtn = document.getElementById('btn-action-release');
            const headerDot = document.getElementById('chat-header-status-dot');
            const bannerReadOnly = document.getElementById('chat-banner-readonly');
            const bannerBot = document.getElementById('chat-banner-bot');
            const typingFeedIndicator = document.getElementById('advisor-typing-feed-indicator');
            const typingInputArea = document.getElementById('chat-input-typing-area');
            const contextRestrictionBar = document.getElementById('chat-context-restriction-bar');
            const monitoringModePill = document.getElementById('monitoring-mode-pill');
            const eventReturnedBot = document.getElementById('event-returned-bot');

            // Reset views
            takeBtn.classList.add('hidden');
            releaseBtn.classList.add('hidden');
            bannerReadOnly.classList.add('hidden');
            bannerBot.classList.add('hidden');
            typingInputArea.classList.remove('hidden');
            contextRestrictionBar.classList.remove('hidden');
            monitoringModePill.classList.add('hidden');
            eventReturnedBot.classList.add('hidden');

            if (currentRole === 'Admin' && (scenario === 'assigned' || scenario === 'bot')) {
                monitoringModePill.classList.remove('hidden');
                bannerReadOnly.classList.remove('hidden');
                typingInputArea.classList.add('hidden');
                contextRestrictionBar.classList.add('hidden');
                return;
            }

            switch(scenario) {
                case 'assigned':
                    releaseBtn.classList.remove('hidden');
                    headerDot.className = "w-1.5 h-1.5 rounded-full bg-[#FFB84D] inline-block";
                    break;
                case 'unassigned':
                    takeBtn.classList.remove('hidden');
                    bannerReadOnly.classList.remove('hidden');
                    typingInputArea.classList.add('hidden');
                    headerDot.className = "w-1.5 h-1.5 rounded-full bg-[#FF5B5B] inline-block";
                    break;
                case 'bot':
                    bannerBot.classList.remove('hidden');
                    typingInputArea.classList.add('hidden');
                    headerDot.className = "w-1.5 h-1.5 rounded-full bg-[#00D4AA] inline-block";
                    eventReturnedBot.classList.remove('hidden');
                    break;
            }
            scrollChatToBottom();
        }

        // Character counting inside Chat input
        function updateLiveCharCounter(textarea) {
            const counter = document.getElementById('chat-char-counter');
            counter.innerText = `${textarea.value.length}/2000`;
        }

        // Trigger dynamic system notifications toast (dismiss in 4 seconds)
        function showSystemNotification(msg, type = 'success') {
            const toast = document.getElementById('operation-success-toast');
            const title = document.getElementById('success-toast-title');
            const desc = document.getElementById('success-toast-desc');

            if (type === 'success') {
                toast.style.borderLeftColor = '#00D4AA';
                title.innerText = "Operación Exitosa";
                desc.innerText = msg;
            } else {
                toast.style.borderLeftColor = '#01A4E3';
                title.innerText = "Aviso de Sistema";
                desc.innerText = msg;
            }

            toast.classList.remove('translate-x-[400px]');
            setTimeout(() => {
                closeOperationSuccessToast();
            }, 4000);
        }

        function closeOperationSuccessToast() {
            const toast = document.getElementById('operation-success-toast');
            if (toast) toast.classList.add('translate-x-[400px]');
        }

        // --- NEW ESCALATED CHAT ALERTS ---
        function triggerNewEscalatedToast() {
            const toast = document.getElementById('new-escalated-toast');
            toast.classList.remove('translate-x-[400px]');
            console.log("🔔 [Audio Simulation] Playing system escalation ping sound.");

            setTimeout(() => {
                closeNewEscalatedToast();
            }, 8000);
        }

        function closeNewEscalatedToast() {
            const toast = document.getElementById('new-escalated-toast');
            if (toast) toast.classList.add('translate-x-[400px]');
        }

        function goToEscalatedChatFromToast() {
            closeNewEscalatedToast();
            switchScreen('chat');
            simulatedChatScenario('unassigned');
        }

        // --- WEBSOCKET SYSTEM STATE SWITCHERS ---
        function toggleWSManualState() {
            wsSimulatedState = (wsSimulatedState + 1) % 3;
            const manualBtn = document.getElementById('btn-manual-ws');
            const sidebarWsText = document.querySelector('#sidebar-ws-status-area span:last-child');
            const sidebarWsDot = document.querySelector('#sidebar-ws-status-area span:first-child');
            const avatarDot = document.getElementById('sidebar-ws-dot');
            const wsBanner = document.getElementById('ws-disconnected-banner');

            wsBanner.classList.add('hidden');

            if (wsSimulatedState === 0) {
                manualBtn.innerHTML = "<span>WS: On</span>";
                sidebarWsText.innerText = "En línea";
                sidebarWsDot.className = "w-2 h-2 rounded-full bg-[#01A4E3] ws-pulse-dot inline-block";
                avatarDot.className = "absolute bottom-0 right-0 w-3 h-3 bg-[#01A4E3] rounded-full border-2 border-[#252522] ws-pulse-dot";
                showSystemNotification('Canal de monitoreo en línea.', 'success');
            } else if (wsSimulatedState === 1) {
                manualBtn.innerHTML = "<span>WS: ...</span>";
                sidebarWsText.innerText = "Reconectando...";
                sidebarWsDot.className = "w-2 h-2 rounded-full bg-[#FFB84D] animate-spin inline-block";
                avatarDot.className = "absolute bottom-0 right-0 w-3 h-3 bg-[#FFB84D] rounded-full border-2 border-[#252522]";
            } else {
                manualBtn.innerHTML = "<span>WS: Off</span>";
                sidebarWsText.innerText = "Sin conexión";
                sidebarWsDot.className = "w-2 h-2 rounded-full bg-[#FF5B5B] inline-block";
                avatarDot.className = "absolute bottom-0 right-0 w-3 h-3 bg-[#FF5B5B] rounded-full border-2 border-[#252522]";
                wsBanner.classList.remove('hidden');
            }
        }

        // Complete the reconnection flow to hide the banner automatically
        function reconnectWSWithSuccess() {
            const manualBtn = document.getElementById('btn-manual-ws');
            const sidebarWsText = document.querySelector('#sidebar-ws-status-area span:last-child');
            const sidebarWsDot = document.querySelector('#sidebar-ws-status-area span:first-child');
            const avatarDot = document.getElementById('sidebar-ws-dot');
            const wsBanner = document.getElementById('ws-disconnected-banner');

            sidebarWsText.innerText = "Reconectando... (intento 2/5)";
            sidebarWsDot.className = "w-2 h-2 rounded-full bg-[#FFB84D] animate-spin inline-block";

            setTimeout(() => {
                wsSimulatedState = 0;
                manualBtn.innerHTML = "<span>WS: On</span>";
                sidebarWsText.innerText = "En línea";
                sidebarWsDot.className = "w-2 h-2 rounded-full bg-[#01A4E3] ws-pulse-dot inline-block";
                avatarDot.className = "absolute bottom-0 right-0 w-3 h-3 bg-[#01A4E3] rounded-full border-2 border-[#252522] ws-pulse-dot";
                wsBanner.classList.add('hidden');
                showSystemNotification('✅ Conexión restaurada con éxito', 'success');
            }, 1200);
        }

        // --- NETWORK LATENCY SIMULATOR (SKELETONS CONTEXT) ---
        function triggerNetworkSimulatedLoading() {
            const skeletonBandeja = document.getElementById('bandeja-skeleton');
            const realBandeja = document.getElementById('bandeja-real-cards');
            const skeletonChat = document.getElementById('chat-skeleton');

            skeletonBandeja.classList.remove('hidden');
            realBandeja.classList.add('hidden');
            skeletonChat.classList.remove('hidden');

            showSystemNotification('Obteniendo actualizaciones de SIMI CRM (1.5s)...', 'info');

            setTimeout(() => {
                skeletonBandeja.classList.add('hidden');
                realBandeja.classList.remove('hidden');
                skeletonChat.classList.add('hidden');
                scrollChatToBottom();
            }, 1500);
        }

        // --- MOBILE DRAWER SIDEBAR TOGGLE ---
        function toggleMobileSidebar(open) {
            const sidebar = document.getElementById('main-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (open) {
                sidebar.classList.remove('-translate-x-full');
                backdrop.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                backdrop.classList.add('hidden');
            }
        }

        // --- MOBILE CHAT INFO DRAWER TOGGLE ---
        function toggleChatRightAside(open) {
            const aside = document.getElementById('chat-right-aside');
            const backdrop = document.getElementById('chat-aside-backdrop');
            if (open) {
                aside.classList.remove('hidden');
                aside.classList.add('flex', 'fixed', 'inset-y-0', 'right-0', 'z-40', 'w-80', 'shadow-2xl', 'h-full');
                backdrop.classList.remove('hidden');
            } else {
                aside.classList.add('hidden');
                aside.classList.remove('flex', 'fixed', 'inset-y-0', 'right-0', 'z-40', 'w-80', 'shadow-2xl', 'h-full');
                backdrop.classList.add('hidden');
            }
        }

        // --- COLLAPSE PRESENTER BAR FOR SMARTPHONES ---
        function togglePresenterDeck() {
            const deck = document.getElementById('presenter-buttons-deck');
            const simDeck = document.getElementById('presenter-simulation-deck');
            const btnText = document.getElementById('btn-presenter-toggle-text');

            if (deck.classList.contains('hidden')) {
                deck.classList.remove('hidden');
                simDeck.classList.remove('hidden');
                deck.classList.add('flex');
                simDeck.classList.add('flex');
                btnText.innerText = "Cerrar";
            } else {
                deck.classList.add('hidden');
                simDeck.classList.add('hidden');
                deck.classList.remove('flex');
                simDeck.classList.remove('flex');
                btnText.innerText = "Ver Controles";
            }
        }

        // --- SESSION EXPIRATION MODAL OVERLAY ---
        function triggerExpiredSession() {
            const overlay = document.getElementById('dialog-modal-overlay');
            const expiredModal = document.getElementById('modal-expired-session');

            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            expiredModal.classList.remove('hidden');
        }

        function forceReturnToLoginAfterExpired() {
            closeActiveModal();
            switchScreen('login');
        }

        // --- SYSTEM DIALOGS MODALS ENGINE ---
        function openModal(modalId) {
            const overlay = document.getElementById('dialog-modal-overlay');
            const modalTake = document.getElementById('modal-confirm-take');
            const modalRelease = document.getElementById('modal-confirm-release');
            const modalNewAdv = document.getElementById('modal-new-advisor');
            const modalEditAdv = document.getElementById('modal-edit-advisor');
            const modalWarning = document.getElementById('modal-deactivate-warning');

            overlay.classList.remove('hidden');
            overlay.classList.add('flex');

            modalTake.classList.add('hidden');
            modalRelease.classList.add('hidden');
            modalNewAdv.classList.add('hidden');
            modalEditAdv.classList.add('hidden');
            modalWarning.classList.add('hidden');

            if (modalId === 'take') modalTake.classList.remove('hidden');
            if (modalId === 'release') modalRelease.classList.remove('hidden');
            if (modalId === 'new-advisor') modalNewAdv.classList.remove('hidden');
            if (modalId === 'edit-advisor') modalEditAdv.classList.remove('hidden');
            if (modalId === 'warning') modalWarning.classList.remove('hidden');
        }

        function closeActiveModal() {
            const overlay = document.getElementById('dialog-modal-overlay');
            const modalTake = document.getElementById('modal-confirm-take');
            const modalRelease = document.getElementById('modal-confirm-release');
            const modalNewAdv = document.getElementById('modal-new-advisor');
            const modalEditAdv = document.getElementById('modal-edit-advisor');
            const modalWarning = document.getElementById('modal-deactivate-warning');
            const expiredModal = document.getElementById('modal-expired-session');

            overlay.classList.remove('flex');
            overlay.classList.add('hidden');

            modalTake.classList.add('hidden');
            modalRelease.classList.add('hidden');
            modalNewAdv.classList.add('hidden');
            modalEditAdv.classList.add('hidden');
            modalWarning.classList.add('hidden');
            expiredModal.classList.add('hidden');
        }

        // --- ATENDER YA MODAL FLOW ASSIGNMENT ---
        function triggerAssignModal(clientName, motive, waitTime) {
            selectedTakeClientName = clientName;
            selectedTakeMotive = motive;
            selectedTakeWait = waitTime;

            document.getElementById('modal-take-client').innerText = clientName;
            document.getElementById('modal-take-motive').innerText = motive;
            document.getElementById('modal-take-wait').innerText = waitTime;

            const takeActiveEl = document.getElementById('modal-take-active-count');
            if (takeActiveEl) {
                if (currentRole === 'Admin') {
                    takeActiveEl.innerHTML = `<span class="text-[#00D4AA]">Sin límite (Admin)</span>`;
                } else {
                    takeActiveEl.innerHTML = `<span class="text-[#00D4AA]">1 de 3</span>`;
                }
            }

            openModal('take');
        }

        function confirmTakeAndAssignChat() {
            closeActiveModal();
            showSystemNotification(`Te has asignado con éxito a Carlos Mendoza Salcedo`, 'success');

            document.getElementById('context-bar-client-name').innerText = "Carlos Mendoza Salcedo";
            document.getElementById('detail-customer-name').innerText = "Carlos Mendoza Salcedo";
            document.getElementById('detail-customer-avatar').innerText = "CS";

            switchScreen('chat');
            simulatedChatScenario('assigned');
        }

        // --- DEVOLVER AL BOT MODAL FLOW ---
        function triggerDevolverConfirmModal() {
            openModal('release');
        }

        function confirmReleaseAndReturnToBot() {
            closeActiveModal();
            showSystemNotification(`Chat liberado. El bot de IA ha retomado la atención.`, 'success');
            simulatedChatScenario('bot');
            toggleChatRightAside(false);
        }

        // --- SIMULATED CHAT MESSAGE FEED ENGINE ---
        let chatPostFailToggle = false;

        function sendChatMessageSimulated() {
            const textInput = document.getElementById('chat-text-area-input');
            const feed = document.getElementById('chat-message-feed');
            const errorBanner = document.getElementById('chat-send-error-banner');

            if (textInput.value.trim() === '') return;

            if (chatPostFailToggle) {
                errorBanner.classList.remove('hidden');
                scrollChatToBottom();
                return;
            }

            errorBanner.classList.add('hidden');
            const bubble = document.createElement('div');
            bubble.className = "flex flex-col items-end max-w-[80%] self-end space-y-1 shrink-0";
            bubble.innerHTML = `
                <div class="bg-[#01A4E3] text-white text-xs p-3 rounded-lg rounded-tr-none leading-relaxed">
                    ${textInput.value.replace(/\n/g, '<br>')}
                </div>
                <span class="text-[9px] text-[#8B8FA8] mr-1">Ahora • Diana Ospina</span>
            `;
            feed.appendChild(bubble);
            textInput.value = '';
            document.getElementById('chat-char-counter').innerText = "0/2000";
            scrollChatToBottom();
        }

        function resendFailedChatMessage() {
            chatPostFailToggle = false;
            sendChatMessageSimulated();
        }

        // Typing dynamic triggers
        function toggleLiveTypingStatus(isTyping) {
            const feedIndicator = document.getElementById('advisor-typing-feed-indicator');
            const indicatorNameText = document.getElementById('typing-indicator-name');

            if (currentRole === 'Admin') {
                indicatorNameText.innerText = "Julio César Gómez está redactando...";
            } else {
                indicatorNameText.innerText = "Diana Ospina está redactando...";
            }

            if (isTyping) {
                feedIndicator.classList.remove('hidden');
                scrollChatToBottom();
            } else {
                setTimeout(() => {
                    feedIndicator.classList.add('hidden');
                }, 1000);
            }
        }

        // --- SCREEN 2: INBOX CONVERSATION FILTER ENGINE ---
        let activeBandejaFilterType = 'all';
        let activeBandejaChannel = 'all';

        function filterBandejaCards(filterType, buttonEl) {
            // Update active states on the filter buttons
            const buttons = buttonEl.parentElement.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.className = "text-[#8B8FA8] hover:text-white px-3 py-1.5 rounded font-medium transition flex items-center gap-1.5";
            });
            buttonEl.className = "bg-[#01A4E3] text-white px-3 py-1.5 rounded font-semibold transition flex items-center gap-1.5";

            activeBandejaFilterType = filterType;
            applyBandejaFilters();

            // Update notification
            const filterNames = {
                'all': 'todas las',
                'escalada': 'las escaladas',
                'activa': 'las activas',
                'cerrada': 'las cerradas'
            };
            showSystemNotification(`Filtrando ${filterNames[filterType] || filterType} conversaciones.`, 'success');
        }

        function filterBandejaByChannel(channelVal) {
            activeBandejaChannel = channelVal;
            applyBandejaFilters();
            showSystemNotification(`Filtrando canal: ${channelVal === 'all' ? 'Todos' : channelVal}.`, 'success');
        }

        function applyBandejaFilters() {
            const cards = document.querySelectorAll('#bandeja-real-cards > div:not(#bandeja-empty-state)');
            let visibleCount = 0;

            cards.forEach(card => {
                const cardType = card.getAttribute('data-filter-type');
                const cardChannel = card.getAttribute('data-filter-channel');
                const cardAssigned = card.getAttribute('data-assigned-to') || '';

                // Role-based visibility rules:
                // Asesor: sees ONLY their own assigned chats OR escalated chats of their area (Comercial for Diana)
                // Admin: sees ALL chats (monitoring mode / full access)
                let matchesRole = true;
                if (currentRole === 'Asesor') {
                    const activeAdvisorName = document.getElementById('sidebar-user-name').innerText; // e.g. "Diana Ospina" or "Andrés Castro"
                    const advisorFirstName = activeAdvisorName.split(' ')[0]; // "Diana" or "Andrés"

                    const isOwnConversation = (cardAssigned === advisorFirstName);
                    const isEscalatedInOwnArea = (cardType === 'escalada') &&
                        ((advisorFirstName === 'Diana' && cardChannel === 'Comercial') ||
                         (advisorFirstName === 'Andrés' && cardChannel === 'Administrativa'));

                    matchesRole = isOwnConversation || isEscalatedInOwnArea;
                }

                const matchesType = (activeBandejaFilterType === 'all') || (cardType === activeBandejaFilterType);
                const matchesChannel = (activeBandejaChannel === 'all') || (cardChannel === activeBandejaChannel);

                if (matchesRole && matchesType && matchesChannel) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Show/hide empty state
            const emptyState = document.getElementById('bandeja-empty-state');
            if (emptyState) {
                if (visibleCount === 0) {
                    emptyState.classList.remove('hidden');
                } else {
                    emptyState.classList.add('hidden');
                }
            }

            // Update filters counts and sidebar badges dynamically
            updateBandejaCounters();
        }

        function updateBandejaCounters() {
            let total = 0;
            let escaladas = 0;
            let activas = 0;
            let cerradas = 0;

            const cards = document.querySelectorAll('#bandeja-real-cards > div:not(#bandeja-empty-state)');

            cards.forEach(card => {
                const cardType = card.getAttribute('data-filter-type');
                const cardChannel = card.getAttribute('data-filter-channel');
                const cardAssigned = card.getAttribute('data-assigned-to') || '';

                // Role-based visibility rules:
                let matchesRole = true;
                if (currentRole === 'Asesor') {
                    const activeAdvisorName = document.getElementById('sidebar-user-name').innerText;
                    const advisorFirstName = activeAdvisorName.split(' ')[0];

                    const isOwnConversation = (cardAssigned === advisorFirstName);
                    const isEscalatedInOwnArea = (cardType === 'escalada') &&
                        ((advisorFirstName === 'Diana' && cardChannel === 'Comercial') ||
                         (advisorFirstName === 'Andrés' && cardChannel === 'Administrativa'));

                    matchesRole = isOwnConversation || isEscalatedInOwnArea;
                }

                // Filter by channel if not 'all'
                const matchesChannel = (activeBandejaChannel === 'all') || (cardChannel === activeBandejaChannel);

                if (matchesRole && matchesChannel) {
                    total++;
                    if (cardType === 'escalada') escaladas++;
                    else if (cardType === 'activa') activas++;
                    else if (cardType === 'cerrada') cerradas++;
                }
            });

            // Update DOM counters
            const totalCounter = document.getElementById('bandeja-total-counter');
            if (totalCounter) {
                totalCounter.innerText = `${total} Totales`;
            }

            // Update filter button text/badges
            const filterContainer = document.getElementById('bandeja-filter-buttons-container');
            if (filterContainer) {
                const buttons = filterContainer.querySelectorAll('button');
                if (buttons.length >= 4) {
                    // Button 0: Todas
                    buttons[0].innerHTML = `Todas (${total})`;
                    // Button 1: Escaladas
                    buttons[1].innerHTML = `Escaladas <span class="bg-[#FF5B5B] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">${escaladas}</span>`;
                    // Button 2: Activas
                    buttons[2].innerHTML = `Activas (${activas})`;
                    // Button 3: Cerradas
                    buttons[3].innerHTML = `Cerradas (${cerradas})`;
                }
            }

            // Also update the sidebar badge counter
            const sidebarBadge = document.getElementById('sidebar-badge-counter');
            if (sidebarBadge) {
                if (currentRole === 'Asesor') {
                    sidebarBadge.innerText = total;
                    sidebarBadge.className = "bg-[#FF5B5B] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold sidebar-full-only";
                } else if (currentRole === 'Admin') {
                    sidebarBadge.innerText = "ADMIN";
                    sidebarBadge.className = "bg-[#FF5B5B]/20 text-[#FF5B5B] text-[8px] px-1.5 py-0.5 rounded font-black uppercase sidebar-full-only";
                }
            }
        }

        // --- CHAT FILE ATTACHMENTS ENGINE ---
        function toggleAttachMenu() {
          const menu = document.getElementById('attach-menu');
          menu.classList.toggle('hidden');
        }

        function triggerFileInput(type) {
          const menu = document.getElementById('attach-menu');
          const preview = document.getElementById('file-preview-bar');
          const previewName = document.getElementById('file-preview-name');
          const previewSize = document.getElementById('file-preview-size');
          const previewIcon = document.getElementById('file-preview-icon');

          menu.classList.add('hidden');

          const files = {
            image: { name: 'foto_inmueble.jpg', size: '1.2 MB • JPG', color: '#01A4E3', icon: 'image' },
            document: { name: 'contrato_arrendamiento.pdf', size: '245 KB • PDF', color: '#FFB84D', icon: 'doc' },
            video: { name: 'recorrido_virtual.mp4', size: '8.4 MB • MP4', color: '#00D4AA', icon: 'video' }
          };

          const selected = files[type];
          previewName.innerText = selected.name;
          previewSize.innerText = selected.size;
          previewIcon.style.backgroundColor = selected.color + '25';
          previewIcon.style.borderColor = selected.color + '50';
          previewIcon.style.color = selected.color;
          preview.classList.remove('hidden');
        }

        function removeSelectedFile() {
          document.getElementById('file-preview-bar').classList.add('hidden');
        }

        // Cerrar el menú de adjuntos al hacer clic fuera
        document.addEventListener('click', function(e) {
          const menu = document.getElementById('attach-menu');
          const btn = e.target.closest('button[onclick="toggleAttachMenu()"]');
          if (!btn && menu && !menu.contains(e.target)) {
            menu.classList.add('hidden');
          }
        });

        // --- SCREEN 4: SEARCH AND FILTER TABLE ENGINE ---
        function filterAdvisorsDynamic() {
            const searchVal = document.getElementById('advisor-search').value.toLowerCase();
            const roleVal = document.getElementById('filter-advisor-role').value;
            const areaVal = document.getElementById('filter-advisor-area').value;
            const rows = document.querySelectorAll('#advisors-table tbody tr');

            rows.forEach(row => {
                const name = row.querySelector('.row-name').innerText.toLowerCase();
                const email = row.querySelector('.row-email').innerText.toLowerCase();
                const matchesSearch = name.includes(searchVal) || email.includes(searchVal);

                const matchesRole = (roleVal === 'todos') || (row.getAttribute('data-role') === roleVal);
                const matchesArea = (areaVal === 'todos') || (row.getAttribute('data-area') === areaVal);

                if (matchesSearch && matchesRole && matchesArea) {
                    row.classList.remove('hidden');
                } else {
                    row.classList.add('hidden');
                }
            });
        }

        // --- SCREEN 8: SEARCH AND FILTER HISTORIAL TABLE ENGINE ---
        function filterHistoryDynamic() {
            const searchVal = document.getElementById('history-search-input').value.toLowerCase();
            const lineVal = document.getElementById('history-filter-line').value;
            const dateVal = document.getElementById('history-filter-date').value;
            const rows = document.querySelectorAll('#history-table-body tr');

            rows.forEach(row => {
                const client = row.querySelector('.history-client-name').innerText.toLowerCase();
                const matchesSearch = client.includes(searchVal);

                const matchesLine = (lineVal === 'todos') || (row.getAttribute('data-line') === lineVal);
                const matchesDate = (dateVal === 'todos') || (row.getAttribute('data-date') === dateVal);

                if (matchesSearch && matchesLine && matchesDate) {
                    row.classList.remove('hidden');
                } else {
                    row.classList.add('hidden');
                }
            });
        }

        // Open closed chat for auditing
        function viewArchivedChat(clientName, area) {
            document.getElementById('context-bar-client-name').innerText = clientName;
            document.getElementById('detail-customer-name').innerText = clientName;
            document.getElementById('detail-customer-avatar').innerText = clientName.split(" ").map(n => n[0]).join("");

            switchScreen('chat');
            simulatedChatScenario('bot');
            showSystemNotification(`Audición de transcripción para: ${clientName}`, 'info');
        }

        // --- ADVISOR MANAGEMENT MODAL WORKFLOWS ---
        function simulateAddNewAdvisor() {
            closeActiveModal();
            showSystemNotification('Asesor creado con éxito. Se le notificará enlace de clave temporal.', 'success');
        }

        function triggerEditAdvisorModal(name, email, role, area) {
            document.getElementById('edit-adv-name').value = name;
            document.getElementById('edit-adv-email').value = email;
            document.getElementById('edit-adv-role').value = role;
            document.getElementById('edit-adv-area').value = area;
            openModal('edit-advisor');
        }

        function simulateEditAdvisorSave() {
            closeActiveModal();
            showSystemNotification('Cambios guardados con éxito en la cuenta.', 'success');
        }

        function toggleAdvisorStateWithModal(name, checkbox) {
            if (!checkbox.checked) {
                targetDeactivateAdvisorName = name;
                activeDeactivateCheckboxEl = checkbox;
                document.getElementById('deactivate-modal-title').innerText = `¿Desactivar a ${name}?`;
                openModal('warning');
            } else {
                checkbox.nextElementSibling.nextElementSibling.innerText = "Activo";
                checkbox.nextElementSibling.nextElementSibling.className = "ml-2 text-[10px] text-[#00D4AA] font-bold";
            }
        }

        function confirmDeactivateAdvisorAndRelease() {
            if (activeDeactivateCheckboxEl) {
                activeDeactivateCheckboxEl.checked = false;
                activeDeactivateCheckboxEl.nextElementSibling.nextElementSibling.innerText = "Inactivo";
                activeDeactivateCheckboxEl.nextElementSibling.nextElementSibling.className = "ml-2 text-[10px] text-[#8B8FA8]";
            }
            closeActiveModal();
            showSystemNotification('Asesor desactivado con éxito. Se liberaron sus chats pendientes.', 'success');
        }

        function cancelDeactivationWithRevert() {
            if (activeDeactivateCheckboxEl) {
                activeDeactivateCheckboxEl.checked = true;
            }
            closeActiveModal();
        }

        // --- SIMULATE LOGIN DEMO STATES ---
        function simulateLoginState(state) {
            const errPanel = document.getElementById('login-error-panel');
            const submitBtn = document.getElementById('login-submit-btn');
            const spinner = document.getElementById('login-btn-spinner');
            const txt = document.getElementById('login-btn-text');

            errPanel.classList.add('hidden');
            submitBtn.disabled = false;
            spinner.classList.add('hidden');
            txt.innerText = "Ingresar al sistema";

            if (state === 'error') {
                errPanel.classList.remove('hidden');
            } else if (state === 'loading') {
                submitBtn.disabled = true;
                spinner.classList.remove('hidden');
                txt.innerText = "Autenticando...";
            }
        }

        // --- ANNOTATIONS SYSTEM TOGGLE ---
        function toggleAnnotations() {
            annotationsEnabled = !annotationsEnabled;
            showSystemNotification(annotationsEnabled ? 'Specs habilitadas.' : 'Specs deshabilitadas.', 'info');
            updateAnnotationsView();
        }

        function updateAnnotationsView() {
            document.querySelectorAll('.annotation-badge').forEach(badge => badge.remove());
            document.querySelectorAll('.annotation-border').forEach(el => el.classList.remove('annotation-border'));

            if (!annotationsEnabled) return;

            document.querySelectorAll('.annotation-spec').forEach(el => {
                el.classList.add('annotation-border');
                const text = el.getAttribute('data-annotation');
                const badge = document.createElement('div');
                badge.className = "annotation-badge absolute top-1 left-1 bg-[#01A4E3] text-white text-[9px] px-2 py-0.5 rounded shadow z-50 font-mono tracking-tight pointer-events-none max-w-[280px]";
                badge.innerText = `💡 Spec: ${text}`;

                if (window.getComputedStyle(el).position === 'static') {
                    el.style.position = 'relative';
                }
                el.appendChild(badge);
            });
        }

        // Standard screen state on layout load
        window.onload = () => {
            setRoleAndSwitch('Asesor', 'bandeja');
        };
        // Toggle alertas de comportamiento (Feature 1)
        function toggleBehaviorAlerts(showEmpty) {
          const list = document.getElementById('alerts-list');
          const empty = document.getElementById('alerts-empty-state');
          const badge = document.getElementById('alerts-badge-count');
          if (showEmpty) {
            list.classList.add('hidden');
            empty.classList.remove('hidden');
            badge.classList.add('hidden');
          } else {
            list.classList.remove('hidden');
            empty.classList.add('hidden');
            badge.classList.remove('hidden');
            badge.textContent = '3';
          }
        }

        // Toggle badge alertas en sidebar (Feature 2)
        function setSidebarAlertsBadge(count) {
          const badge = document.getElementById('sidebar-alerts-badge');
          if (!badge) return;
          if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
        }

        // Selector de disponibilidad (Feature 4)
        function setAvailability(state) {
          const dot = document.getElementById('avail-dot');
          const label = document.getElementById('avail-label');
          const picker = document.getElementById('avail-duration-picker');
          const btnAvail = document.getElementById('avail-btn-available');
          const btnBreak = document.getElementById('avail-btn-break');
          const btnOffline = document.getElementById('avail-btn-offline');

          [btnAvail, btnBreak, btnOffline].forEach(b => {
            b.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-[#3A3A37] text-[#8B8FA8] transition';
          });

          if (state === 'available') {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-[#00D4AA]';
            label.className = 'text-xs font-semibold text-[#00D4AA]';
            label.textContent = 'Disponible';
            btnAvail.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/40 transition';
            picker.classList.add('hidden');
          } else if (state === 'break') {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-[#FFB84D]';
            label.className = 'text-xs font-semibold text-[#FFB84D]';
            label.textContent = 'En descanso';
            btnBreak.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FFB84D]/20 text-[#FFB84D] border border-[#FFB84D]/40 transition';
            picker.classList.remove('hidden');
          } else if (state === 'offline') {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-[#FF5B5B]';
            label.className = 'text-xs font-semibold text-[#FF5B5B]';
            label.textContent = 'No disponible';
            btnOffline.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FF5B5B]/20 text-[#FF5B5B] border border-[#FF5B5B]/40 transition';
            picker.classList.remove('hidden');
          }
        }

        function selectDuration(btn) {
          document.querySelectorAll('.avail-dur-btn').forEach(b => {
            b.className = 'avail-dur-btn px-3 py-1 rounded-full text-[10px] font-bold border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#01A4E3] transition';
          });
          btn.className = 'avail-dur-btn px-3 py-1 rounded-full text-[10px] font-bold border border-[#01A4E3] text-[#01A4E3] bg-[#01A4E3]/10';
        }

        // Validar horario (Feature 3)
        function validateScheduleTime() {
          const start = document.getElementById('schedule-time-start').value;
          const end = document.getElementById('schedule-time-end').value;
          const err = document.getElementById('schedule-time-error');
          if (start && end && end <= start) {
            err.classList.remove('hidden');
          } else {
            err.classList.add('hidden');
          }
        }

        // Especialidad dinámica (Feature 7)
        function updateEspecialidadOptions(areaValue, selectId) {
          const sel = document.getElementById(selectId);
          if (!sel) return;
          sel.innerHTML = '';
          let opts = [];
          if (areaValue === 'Administrativa') {
            opts = ['Financiera', 'Mantenimiento y Contratos', 'General'];
          } else if (areaValue === 'Comercial') {
            opts = ['Comercial', 'General'];
          } else {
            opts = ['General'];
          }
          opts.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o; opt.textContent = o;
            sel.appendChild(opt);
          });
        }

        // Simular adjunto de archivo (Feature 9)
        function simulateFileAttach(type) {
          document.getElementById('attach-menu').classList.add('hidden');
          const bar = document.getElementById('file-preview-bar');
          const icon = document.getElementById('file-preview-icon');
          const name = document.getElementById('file-preview-name');
          const meta = document.getElementById('file-preview-size') || document.getElementById('file-preview-meta');

          const configs = {
            image: { name: 'foto_inmueble.jpg', meta: '2.4 MB · JPG', color: '#01A4E3' },
            document: { name: 'contrato_arrendamiento.pdf', meta: '840 KB · PDF', color: '#FFB84D' },
            video: { name: 'video_recorrido.mp4', meta: '18.2 MB · MP4', color: '#00D4AA' }
          };

          const cfg = configs[type];
          icon.style.backgroundColor = cfg.color + '1a';
          icon.style.borderColor = cfg.color + '50';
          icon.style.color = cfg.color;
          if (name) name.textContent = cfg.name;
          if (meta) meta.textContent = cfg.meta;
          bar.classList.remove('hidden');
        }
    </script>

    <!-- MODAL: Confirmar cierre de conversación (Feature 8) -->
    <div id="modal-confirm-close" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div class="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div class="flex flex-col items-center text-center gap-4">
          <div class="w-12 h-12 rounded-full bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 flex items-center justify-center">
            <svg class="w-6 h-6 text-[#FF5B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white mb-1">¿Cerrar esta conversación?</h3>
            <p class="text-xs text-[#8B8FA8] leading-relaxed">La conversación pasará al historial y el cliente no podrá continuar por este hilo.</p>
          </div>
          <div class="flex gap-3 w-full">
            <button onclick="document.getElementById('modal-confirm-close').classList.add('hidden')" class="flex-1 px-4 py-2 border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#8B8FA8] rounded-lg text-xs font-semibold transition">Cancelar</button>
            <button onclick="document.getElementById('modal-confirm-close').classList.add('hidden'); showSystemNotification('Conversación cerrada exitosamente', 'success');" class="flex-1 px-4 py-2 bg-[#FF5B5B] hover:bg-[#e04f4f] text-white rounded-lg text-xs font-bold transition">Confirmar cierre</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Agregar Intervalo de Horario (Feature 3) -->
    <div id="modal-add-schedule" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div class="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-sm font-bold text-white">Agregar Intervalo de Inactividad</h3>
          <button onclick="document.getElementById('modal-add-schedule').classList.add('hidden')" class="text-[#8B8FA8] hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-1">Nombre del intervalo</label>
            <input type="text" placeholder="Ej: Almuerzo" class="w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-lg px-3 py-2 text-xs outline-none transition" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-1">Inicio</label>
              <input type="time" id="schedule-time-start" onchange="validateScheduleTime()" value="12:00" class="w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-lg px-3 py-2 text-xs outline-none transition" />
            </div>
            <div>
              <label class="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-1">Fin</label>
              <input type="time" id="schedule-time-end" onchange="validateScheduleTime()" value="13:00" class="w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-lg px-3 py-2 text-xs outline-none transition" />
            </div>
          </div>
          <div id="schedule-time-error" class="hidden text-[10px] text-[#FF5B5B] bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 px-3 py-1.5 rounded">La hora de fin debe ser posterior a la de inicio.</div>
          <div>
            <label class="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-2">Días activos</label>
            <div class="flex gap-1.5 flex-wrap">
              <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked class="accent-[#01A4E3]" /><span class="text-xs text-white">L</span></label>
              <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked class="accent-[#01A4E3]" /><span class="text-xs text-white">M</span></label>
              <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked class="accent-[#01A4E3]" /><span class="text-xs text-white">X</span></label>
              <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked class="accent-[#01A4E3]" /><span class="text-xs text-white">J</span></label>
              <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked class="accent-[#01A4E3]" /><span class="text-xs text-white">V</span></label>
              <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="accent-[#01A4E3]" /><span class="text-xs text-white">S</span></label>
              <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="accent-[#01A4E3]" /><span class="text-xs text-white">D</span></label>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="document.getElementById('modal-add-schedule').classList.add('hidden')" class="flex-1 px-4 py-2 border border-[#3A3A37] text-[#8B8FA8] hover:text-white rounded-lg text-xs font-semibold transition">Cancelar</button>
          <button onclick="document.getElementById('modal-add-schedule').classList.add('hidden'); showSystemNotification('Intervalo guardado', 'success');" class="flex-1 px-4 py-2 bg-[#01A4E3] hover:bg-[#0190C8] text-white rounded-lg text-xs font-bold transition">Guardar</button>
        </div>
      </div>
    </div>

</body>
</html>
