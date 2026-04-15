import { supabase, getCurrentUser } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentUser();
    
    if (!user) {
        alert("You must be logged in to view the dashboard.");
        window.location.href = 'index.html';
        return;
    }

    const dashTitle = document.getElementById('dash-title');
    const dashDate = document.getElementById('dash-date');
    const dashType = document.getElementById('dash-type');
    const dashMedia = document.getElementById('dash-media');
    const dashGuests = document.getElementById('dash-guests');
    const dashGrid = document.getElementById('dash-grid');
    const dashShare = document.getElementById('dash-share');

    let currentEvent = null;

    async function loadDashboard() {
        try {
            // Fetch the most recent event for this host
            const { data: events, error } = await supabase
                .from('events')
                .select('*')
                .eq('host_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (!events || events.length === 0) {
                dashTitle.textContent = "No Events Yet";
                dashDate.textContent = "N/A";
                dashGrid.innerHTML = '<div class="col-span-full text-center py-20">Create an event to see it here!</div>';
                return;
            }

            currentEvent = events[0];

            dashTitle.textContent = currentEvent.title;
            if (currentEvent.event_date) {
                dashDate.textContent = new Date(currentEvent.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            } else {
                dashDate.textContent = "No Date Set";
            }
            if (currentEvent.type) dashType.textContent = `${currentEvent.type} Dashboard`;

            // Setup share button
            if (dashShare) {
                dashShare.addEventListener('click', () => {
                    const link = `${window.location.origin}/gallery.html?event=${currentEvent.slug}`;
                    navigator.clipboard.writeText(link);
                    alert(`Copied link to clipboard: ${link}`);
                });
            }

            // Fetch Photos
            await loadPhotos();

        } catch (err) {
            console.error(err);
            dashTitle.textContent = "Error loading dashboard";
        }
    }

    async function loadPhotos() {
        if (!currentEvent) return;

        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .eq('event_id', currentEvent.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        dashMedia.textContent = photos.length;
        
        // Calculate unique guests based on uploaded_by
        const uniqueGuests = new Set(photos.map(p => p.uploaded_by));
        dashGuests.textContent = uniqueGuests.size;

        dashGrid.innerHTML = '';

        if (photos.length === 0) {
            dashGrid.innerHTML = '<div class="col-span-full text-center py-20 text-tertiary">No media uploaded yet.</div>';
            return;
        }

        photos.forEach(photo => {
            const div = document.createElement('div');
            div.className = "break-inside-avoid relative group overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm";
            div.innerHTML = `
                <img class="w-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110 bg-surface-variant" src="${photo.url}" alt="Memory" />
                <div class="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <div class="flex justify-between items-center">
                        <button data-id="${photo.id}" data-path="${photo.storage_path}" class="delete-btn p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-error transition-colors">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                        <span class="text-white/80 text-xs font-medium">by ${photo.uploaded_by}</span>
                    </div>
                </div>
            `;
            dashGrid.appendChild(div);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const photoId = btn.getAttribute('data-id');
                const photoPath = btn.getAttribute('data-path');

                if (confirm("Are you sure you want to delete this photo forever?")) {
                    const { error: dbError } = await supabase.from('photos').delete().eq('id', photoId);
                    if (!dbError) {
                        await supabase.storage.from('event-photos').remove([photoPath]);
                        loadPhotos(); // refresh
                    } else {
                        alert("Error deleting photo: " + dbError.message);
                    }
                }
            });
        });
    }

    loadDashboard();
});
