import { supabase, getCurrentUser } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Basic Auth Modal Elements
    const authModal = document.getElementById('auth-modal');
    const createEventBtn = document.getElementById('create-event-btn');
    const heroCreateEventBtn = document.getElementById('hero-create-event-btn');
    const closeAuthBtn = document.getElementById('close-auth-modal');
    
    const authForm = document.getElementById('auth-form');
    const authModeToggle = document.getElementById('auth-mode-toggle');
    const authTitle = document.getElementById('auth-title');
    const authSubmit = document.getElementById('auth-submit');
    const authError = document.getElementById('auth-error');

    let isLoginMode = true;

    // Check if user is already logged in
    const user = await getCurrentUser();
    if (user) {
        // Change 'Create Event' to 'Dashboard' or directly allow navigation
        if (createEventBtn) createEventBtn.textContent = 'Dashboard';
        if (heroCreateEventBtn) heroCreateEventBtn.textContent = 'Dashboard';
    }

    const openModal = (e) => {
        if(e) e.preventDefault();
        if (user) {
            window.location.href = 'admin-dashboard.html';
        } else {
            authModal.classList.remove('hidden');
        }
    };

    if (createEventBtn) createEventBtn.addEventListener('click', openModal);
    if (heroCreateEventBtn) heroCreateEventBtn.addEventListener('click', openModal);
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => authModal.classList.add('hidden'));

    if (authModeToggle) {
        authModeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            authTitle.textContent = isLoginMode ? 'Welcome Back' : 'Create an Account';
            authSubmit.textContent = isLoginMode ? 'Log In' : 'Sign Up';
            authModeToggle.innerHTML = isLoginMode 
                ? "Don't have an account? <span class='font-bold underline'>Sign up</span>"
                : "Already have an account? <span class='font-bold underline'>Log in</span>";
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            authError.classList.add('hidden');
            authError.textContent = '';
            
            const email = authForm.email.value;
            const password = authForm.password.value;

            authSubmit.textContent = 'Processing...';
            authSubmit.disabled = true;

            try {
                if (isLoginMode) {
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    window.location.href = 'admin-dashboard.html';
                } else {
                    const { error } = await supabase.auth.signUp({ email, password });
                    if (error) throw error;
                    // Auto login after signup might require checking email confirmation based on Supabase settings.
                    // For now, assume auto-login if email confirmations are off, or just alert.
                    alert("Account created successfully! If email confirmation is enabled, please check your inbox.");
                    window.location.href = 'create-event.html';
                }
            } catch (err) {
                authError.textContent = err.message;
                authError.classList.remove('hidden');
            } finally {
                authSubmit.textContent = isLoginMode ? 'Log In' : 'Sign Up';
                authSubmit.disabled = false;
            }
        });
    }
});
