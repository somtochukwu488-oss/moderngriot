import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug = urlParams.get('event');

    const galleryTitle = document.getElementById('gallery-title');
    const galleryDate = document.getElementById('gallery-date');
    const galleryType = document.getElementById('gallery-type');
    const galleryGrid = document.getElementById('gallery-grid');
    const fileUpload = document.getElementById('file-upload');
    const uploadStatus = document.getElementById('upload-status');

    let currentEvent = null;

    async function loadEvent() {
        if (!eventSlug) {
            galleryTitle.innerHTML = 'No Event Specified';
            galleryGrid.innerHTML = '';
            return;
        }

        try {
            const { data: event, error } = await supabase
                .from('events')
                .select('*')
                .eq('slug', eventSlug)
                .single();

            if (error || !event) throw new Error('Event not found.');

            currentEvent = event;
            galleryTitle.innerHTML = `${event.title} <br/><span id="gallery-date" class="not-italic text-tertiary"></span>`;
            if (event.event_date) {
                document.getElementById('gallery-date').textContent = new Date(event.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            }
            if (event.type) galleryType.textContent = `${event.type} Memories`;

            await loadPhotos();
        } catch (err) {
            console.error(err);
            galleryTitle.innerHTML = 'Event Not Found';
            galleryGrid.innerHTML = '';
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
            console.error('Error fetching photos:', error);
            return;
        }

        galleryGrid.innerHTML = '';

        if (photos.length === 0) {
            galleryGrid.innerHTML = '<div class="col-span-full text-center text-tertiary">No photos uploaded yet. Be the first!</div>';
            return;
        }

        photos.forEach((photo, index) => {
            // Pick a class pattern based on index to simulate masonry asymmetric grid
            const classes = ['item-tall', 'item-wide', '', '', 'item-tall', 'item-wide', ''];
            const assignedClass = classes[index % classes.length];

            const div = document.createElement('div');
            div.className = `${assignedClass} memory-hover relative overflow-hidden rounded-full shadow-sm group`;

            let downloadBtnHTML = '';
            if (currentEvent.allow_downloads) {
                downloadBtnHTML = `
                <div class="download-overlay absolute inset-0 bg-primary/20 opacity-0 transition-opacity flex items-start justify-end p-6 pointer-events-none group-hover:pointer-events-auto">
                    <a href="${photo.url}" download target="_blank" class="bg-surface-container-lowest/90 text-primary p-3 rounded-full shadow-lg hover:bg-white transition-all pointer-events-auto">
                        <span class="material-symbols-outlined">download</span>
                    </a>
                </div>`;
            }

            div.innerHTML = `
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 bg-surface-variant" src="${photo.url}" alt="Memory" />
                ${downloadBtnHTML}
                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
                    <p class="text-sm font-label font-medium">By ${photo.uploaded_by}</p>
                </div>
            `;

            galleryGrid.appendChild(div);
        });
    }

    if (fileUpload) {
        fileUpload.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            if (!currentEvent) return;

            let guestName = prompt("Enter your name to upload these photos:", "Guest");
            if (!guestName) guestName = "Anonymous";

            uploadStatus.classList.remove('hidden');
            uploadStatus.textContent = `Uploading ${files.length} file(s)...`;

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${currentEvent.id}/${fileName}`;

                    // Upload to Storage
                    const { error: uploadError, data: uploadData } = await supabase.storage
                        .from('event-photos')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    // Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('event-photos')
                        .getPublicUrl(filePath);

                    // Insert to Photos Table
                    const { error: dbError } = await supabase.from('photos').insert({
                        event_id: currentEvent.id,
                        storage_path: filePath,
                        url: publicUrl,
                        uploaded_by: guestName
                    });

                    if (dbError) throw dbError;
                }

                uploadStatus.textContent = 'Upload complete!';
                setTimeout(() => uploadStatus.classList.add('hidden'), 3000);
                
                // Refresh gallery
                await loadPhotos();

            } catch (err) {
                console.error(err);
                uploadStatus.textContent = `Error: ${err.message}`;
            }
        });
    }

    loadEvent();
});
