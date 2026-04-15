import { supabase, getCurrentUser } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentUser();
    
    // In a real app we might redirect to landing if !user.
    // For now, if no user, we might fail insertion due to RLS, but service_role bypasses it.
    
    const eventForm = document.getElementById('create-event-form');
    const submitBtn = document.getElementById('event-submit');
    const errorDiv = document.getElementById('event-error');

    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');
            errorDiv.textContent = '';
            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Creating...';

            const title = document.getElementById('event-title').value;
            const type = document.getElementById('event-type').value;
            const event_date = document.getElementById('event-date').value;
            const slug = document.getElementById('event-slug').value;
            const allow_downloads = document.getElementById('allow-downloads').checked;

            try {
                // Check if slug is unique
                const { data: existing } = await supabase.from('events').select('slug').eq('slug', slug).single();
                if (existing) {
                    throw new Error('This link is already taken. Please choose another one.');
                }

                // Insert into Supabase
                const { error } = await supabase.from('events').insert([
                    {
                        title,
                        type,
                        event_date,
                        slug,
                        host_id: user ? user.id : null,
                        allow_downloads
                    }
                ]);

                if (error) throw error;

                // Success
                alert(`Event created successfully! Share this link with guests: moderngriot.io/${slug}`);
                window.location.href = 'admin-dashboard.html';

            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = 'Create My Event Page';
            }
        });
    }
});
