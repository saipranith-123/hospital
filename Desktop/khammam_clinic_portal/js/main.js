// Receptionist/Clinic WhatsApp number (Format: 91 + 10 digits without '+' or spaces)
const CLINIC_WHATSAPP_NUMBER = "918309772422"; 

document.addEventListener('DOMContentLoaded', () => {
    // Set minimum booking date to today
    const dateInput = document.getElementById('bookingDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    // Sync Department field on Doctor change
    const doctorSelect = document.getElementById('doctorSelect');
    const specialityInput = document.getElementById('specialityInput');

    doctorSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        specialityInput.value = selectedOption.getAttribute('data-dept') || '';
    });

    // Auto-select doctor when clicking "Select & Book" button on doctor card
    const selectButtons = document.querySelectorAll('.select-doc-btn');
    selectButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const doctorName = btn.getAttribute('data-doctor');
            const dept = btn.getAttribute('data-speciality');

            for (let i = 0; i < doctorSelect.options.length; i++) {
                if (doctorSelect.options[i].value === doctorName) {
                    doctorSelect.selectedIndex = i;
                    specialityInput.value = dept;
                    break;
                }
            }
            // Smooth scroll to book section
            document.getElementById('book-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Handle Form Submit
    const form = document.getElementById('appointmentForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bookingData = {
            name: document.getElementById('patientName').value.trim(),
            phone: document.getElementById('patientPhone').value.trim(),
            doctor: doctorSelect.value,
            speciality: specialityInput.value,
            date: document.getElementById('bookingDate').value,
            time: document.getElementById('bookingTime').value,
            notes: document.getElementById('patientNotes').value.trim()
        };

        try {
            // 1. Save data to Flask SQLite Backend
            const response = await fetch('/api/book-appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (result.success) {
                // 2. Format WhatsApp Alert Message
                const whatsappMsg = `*Apex Multi-Speciality Clinic, Khammam*%0A` +
                                   `*New Appointment Request*%0A` +
                                   `----------------------------%0A` +
                                   `*Patient Name:* ${bookingData.name}%0A` +
                                   `*Mobile:* ${bookingData.phone}%0A` +
                                   `*Doctor:* ${bookingData.doctor} (${bookingData.speciality})%0A` +
                                   `*Date:* ${bookingData.date}%0A` +
                                   `*Time Slot:* ${bookingData.time}%0A` +
                                   `*Notes/Symptoms:* ${bookingData.notes || 'None'}%0A` +
                                   `*Booking ID:* #${result.booking_id}%0A` +
                                   `----------------------------%0A` +
                                   `Please confirm the appointment slot.`;

                // 3. Open WhatsApp direct chat
                const waUrl = `https://wa.me/${CLINIC_WHATSAPP_NUMBER}?text=${whatsappMsg}`;
                
                alert('Appointment details saved! Redirecting to WhatsApp to send instant confirmation...');
                form.reset();
                specialityInput.value = '';
                
                // Open WhatsApp tab
                window.open(waUrl, '_blank');
            } else {
                alert('Failed to save booking: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Something went wrong. Please check your connection.');
        }
    });
});