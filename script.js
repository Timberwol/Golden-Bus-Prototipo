document.addEventListener('DOMContentLoaded', () => {
            const busForm = document.getElementById('bus-locator-form');
            const routeResult = document.getElementById('route-result');
            const routeMap = document.getElementById('route-map');
            const busMarkers = document.getElementById('bus-markers');
            const toggleAnimationBtn = document.getElementById('toggle-animation');
            const stationFilter = document.getElementById('station-filter');
            const zoomInBtn = document.getElementById('zoom-in');
            const zoomOutBtn = document.getElementById('zoom-out');
            const refreshDataBtn = document.getElementById('refresh-data');
            const swapLocationsBtn = document.getElementById('swap-locations');
            const clearFormBtn = document.getElementById('clear-form');
            const busDetailsModal = document.getElementById('bus-details');
            const busDetailsContent = document.getElementById('bus-details-content');
            const modalClose = document.getElementById('modal-close');
            const themeToggle = document.getElementById('theme-toggle');
            const contactForm = document.getElementById('contact-form');
            let animationRunning = true;
            let animationInterval;
            let zoomLevel = 1;

            // Theme Toggle
            themeToggle.addEventListener('click', () => {
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
                themeToggle.textContent = isDark ? '🌙' : '☀';
            });

            // Scroll Animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('section').forEach(section => {
                section.classList.add('fade-in');
                observer.observe(section);
            });

            // Localizador de rutas
            busForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const origin = document.getElementById('origin').value;
                const destination = document.getElementById('destination').value;

                routeResult.style.animation = 'none';
                routeResult.offsetHeight;
                routeResult.style.animation = 'slideIn 0.6s ease-out';

                if (origin === destination) {
                    routeResult.innerHTML = '<p>Origen y destino no pueden ser iguales.</p>';
                    routeResult.classList.add('error');
                    routeResult.setAttribute('aria-live', 'assertive');
                    routeMap.innerHTML = '';
                    return;
                }

                const routes = {
                    'Terminal 1-Terminal 2': { time: '5-7 min', frequency: 'Cada 5 min', path: 'M50,50 L1250,50' },
                    'Terminal 1-Terminal de Carga': { time: '10-12 min', frequency: 'Cada 10 min', path: 'M50,50 L1350,50' },
                    'Terminal 2-Terminal 1': { time: '5-7 min', frequency: 'Cada 5 min', path: 'M1250,50 L50,50' },
                    'Terminal 2-Terminal de Carga': { time: '8-10 min', frequency: 'Cada 10 min', path: 'M1250,50 L1350,50' },
                    'Terminal de Carga-Terminal 1': { time: '10-12 min', frequency: 'Cada 10 min', path: 'M1350,50 L50,50' },
                    'Terminal de Carga-Terminal 2': { time: '8-10 min', frequency: 'Cada 10 min', path: 'M1350,50 L1250,50' }
                };

                const routeKey = `${origin}-${destination}`;
                const route = routes[routeKey];

                if (route) {
                    routeResult.innerHTML = `
                        <p><strong>Ruta:</strong> ${origin} a ${destination}</p>
                        <p><strong>Tiempo estimado:</strong> ${route.time}</p>
                        <p><strong>Frecuencia:</strong> ${route.frequency}</p>
                    `;
                    routeResult.classList.remove('error');
                    routeMap.innerHTML = `<svg width="100%" height="100" viewBox="0 0 1400 100">
                        <path d="${route.path}" stroke="#001F5B" stroke-width="4" stroke-dasharray="8,8"/>
                        <circle cx="${route.path.includes('M50') ? 50 : route.path.includes('M1250') ? 1250 : 1350}" cy="50" r="8" fill="#FFC107"/>
                        <circle cx="${route.path.includes('L50') ? 50 : route.path.includes('L1250') ? 1250 : 1350}" cy="50" r="8" fill="#001F5B"/>
                    </svg>`;
                    routeResult.setAttribute('aria-live', 'polite');
                } else {
                    routeResult.innerHTML = '<p>Ruta no disponible.</p>';
                    routeResult.classList.add('error');
                    routeMap.innerHTML = '';
                    routeResult.setAttribute('aria-live', 'assertive');
                }
            });

            // Swap Locations
            swapLocationsBtn.addEventListener('click', () => {
                const origin = document.getElementById('origin');
                const destination = document.getElementById('destination');
                const temp = origin.value;
                origin.value = destination.value;
                destination.value = temp;
            });

            // Clear Form
            clearFormBtn.addEventListener('click', () => {
                busForm.reset();
                routeResult.innerHTML = '';
                routeMap.innerHTML = '';
                routeResult.classList.remove('error');
            });

            // Contact Form
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const message = document.getElementById('message').value;

                if (name && email && message) {
                    showNotification('Mensaje enviado con éxito. ¡Gracias por contactarnos!');
                    contactForm.reset();
                } else {
                    showNotification('Por favor, completa todos los campos.', true);
                }
            });

            // Localizador de buses en vivo
            const stations = [
                { x: 50, name: 'Terminal 1' },
                { x: 200, name: 'Estación 1' },
                { x: 350, name: 'Estación 2' },
                { x: 500, name: 'Estación 3' },
                { x: 650, name: 'Estación 4' },
                { x: 800, name: 'Estación 5' },
                { x: 950, name: 'Estación 6' },
                { x: 1100, name: 'Estación 7' },
                { x: 1250, name: 'Terminal 2' },
                { x: 1350, name: 'Terminal de Carga' }
            ];

            function adjustStationsForMobile() {
                if (window.innerWidth <= 768) {
                    stations.forEach((station, index) => {
                        station.x = 50 + (index * 100);
                    });
                } else {
                    stations.forEach((station, index) => {
                        station.x = 50 + (index * 150);
                        if (index === 9) station.x = 1350;
                    });
                }
            }

            const busData = [
                { id: 'GB001', stationIndex: 0, x: 50, location: 'Terminal 1', status: 'En ruta a Estación 1', eta: '2 min', direction: 1 },
                { id: 'GB002', stationIndex: 4, x: 650, location: 'Estación 4', status: 'En ruta a Estación 5', eta: '3 min', direction: 1 },
                { id: 'GB003', stationIndex: 8, x: 1250, location: 'Terminal 2', status: 'En ruta a Terminal de Carga', eta: '4 min', direction: 1 }
            ];

            function updateLiveBuses() {
                if (!animationRunning) return;
                busMarkers.innerHTML = '';
                const selectedStation = stationFilter.value;

                adjustStationsForMobile();
                updateStationPositions();

                busData.forEach(bus => {
                    if (selectedStation !== 'all' && bus.location !== selectedStation) return;

                    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    markerGroup.setAttribute('class', 'bus-marker');
                    markerGroup.setAttribute('id', `bus-${bus.id}`);
                    markerGroup.setAttribute('aria-label', `Bus ${bus.id} en ${bus.location}`);
                    markerGroup.setAttribute('transform', `translate(${bus.x - 25}, 175) scale(${1 / zoomLevel})`);

                    const busIcon = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    busIcon.setAttribute('class', 'bus-icon');
                    busIcon.innerHTML = `
                        <rect x="0" y="0" width="50" height="25" rx="4" fill="#FFC107" stroke="#001F5B" stroke-width="2"/>
                        <circle cx="12" cy="25" r="4" fill="#001F5B"/>
                        <circle cx="38" cy="25" r="4" fill="#001F5B"/>
                        <rect x="8" y="4" width="12" height="8" fill="#fff"/>
                        <rect x="30" y="4" width="12" height="8" fill="#fff"/>
                        <path d="M5 12 L45 12" stroke="#001F5B" stroke-width="1"/>
                    `;
                    markerGroup.appendChild(busIcon);

                    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    tooltip.setAttribute('x', bus.x);
                    tooltip.setAttribute('y', '140');
                    tooltip.setAttribute('class', 'tooltip');
                    tooltip.setAttribute('text-anchor', 'middle');
                    tooltip.textContent = `Bus ${bus.id}: ${bus.status} (ETA: ${bus.eta})`;

                    busMarkers.appendChild(markerGroup);
                    busMarkers.appendChild(tooltip);

                    bus.stationIndex += bus.direction;
                    if (bus.stationIndex >= stations.length - 1) {
                        bus.direction = -1;
                        showNotification(`Bus ${bus.id} ha llegado a ${stations[bus.stationIndex].name}`);
                    } else if (bus.stationIndex <= 0) {
                        bus.direction = 1;
                        showNotification(`Bus ${bus.id} ha llegado a ${stations[bus.stationIndex].name}`);
                    }

                    bus.x = stations[bus.stationIndex].x;
                    bus.location = stations[bus.stationIndex].name;
                    bus.eta = `${Math.floor(Math.random() * 5) + 1} min`;
                    bus.status = `En ruta a ${stations[Math.min(bus.stationIndex + bus.direction, stations.length - 1)].name}`;
                });
            }

            function updateStationPositions() {
                const circles = document.querySelectorAll('#stations circle');
                const labels = document.querySelectorAll('#stations text');
                stations.forEach((station, index) => {
                    circles[index].setAttribute('cx', station.x);
                    labels[index].setAttribute('x', station.x);
                });
                document.querySelector('.route-line').setAttribute('x2', stations[stations.length - 1].x);
                document.querySelector('.route-line-bg').setAttribute('x2', stations[stations.length - 1].x);
            }

            // Zoom Controls
            zoomInBtn.addEventListener('click', () => {
                zoomLevel = Math.min(zoomLevel + 0.2, 2);
                document.getElementById('bus-map').setAttribute('style', `transform: scale(${zoomLevel})`);
            });

            zoomOutBtn.addEventListener('click', () => {
                zoomLevel = Math.max(zoomLevel - 0.2, 0.5);
                document.getElementById('bus-map').setAttribute('style', `transform: scale(${zoomLevel})`);
            });

            // Refresh Data
            refreshDataBtn.addEventListener('click', () => {
                updateLiveBuses();
                showNotification('Datos actualizados.');
            });

            // Animation Control
            animationInterval = setInterval(updateLiveBuses, 3000);
            updateLiveBuses();

            toggleAnimationBtn.addEventListener('click', () => {
                animationRunning = !animationRunning;
                toggleAnimationBtn.textContent = animationRunning ? 'Pausar' : 'Reanudar';
                toggleAnimationBtn.setAttribute('aria-label', animationRunning ? 'Pausar animación de buses' : 'Reanudar animación de buses');
                if (animationRunning) {
                    animationInterval = setInterval(updateLiveBuses, 3000);
                    updateLiveBuses();
                } else {
                    clearInterval(animationInterval);
                }
            });

            // Station Filter
            stationFilter.addEventListener('change', () => {
                updateLiveBuses();
            });

            // Bus Details Modal
            busMarkers.addEventListener('click', (e) => {
                const marker = e.target.closest('.bus-marker');
                if (marker) {
                    const busId = marker.id.replace('bus-', '');
                    const bus = busData.find(b => b.id === busId);
                    if (bus) {
                        busDetailsContent.innerHTML = `
                            <p><strong>Bus ID:</strong> ${bus.id}</p>
                            <p><strong>Ubicación:</strong> ${bus.location}</p>
                            <p><strong>Estado:</strong> ${bus.status}</p>
                            <p><strong>ETA:</strong> ${bus.eta}</p>
                        `;
                        busDetailsModal.classList.remove('hidden');
                        busDetailsModal.setAttribute('aria-hidden', 'false');
                    }
                }
            });

            modalClose.addEventListener('click', () => {
                busDetailsModal.classList.add('hidden');
                busDetailsModal.setAttribute('aria-hidden', 'true');
            });

            // Tooltips
            busMarkers.addEventListener('mouseover', (e) => {
                if (e.target.closest('.bus-marker')) {
                    const marker = e.target.closest('.bus-marker');
                    const tooltip = marker.nextSibling;
                    if (tooltip && tooltip.classList.contains('tooltip')) {
                        tooltip.setAttribute('style', 'opacity: 1;');
                    }
                }
            });

            busMarkers.addEventListener('mouseout', (e) => {
                if (e.target.closest('.bus-marker')) {
                    const marker = e.target.closest('.bus-marker');
                    const tooltip = marker.nextSibling;
                    if (tooltip && tooltip.classList.contains('tooltip')) {
                        tooltip.setAttribute('style', 'opacity: 0;');
                    }
                }
            });

            busMarkers.addEventListener('click', (e) => {
                if (e.target.closest('.bus-marker')) {
                    const marker = e.target.closest('.bus-marker');
                    const tooltip = marker.nextSibling;
                    if (tooltip && tooltip.classList.contains('tooltip')) {
                        const isTouched = marker.classList.contains('touched');
                        document.querySelectorAll('.bus-marker.touched').forEach(m => m.classList.remove('touched'));
                        document.querySelectorAll('.tooltip').forEach(t => t.setAttribute('style', 'opacity: 0;'));
                        if (!isTouched) {
                            marker.classList.add('touched');
                            tooltip.setAttribute('style', 'opacity: 1;');
                        }
                    }
                }
            });

            // Notifications
            function showNotification(message, isError = false) {
                const notifications = document.getElementById('notifications');
                const notification = document.createElement('div');
                notification.className = `notification ${isError ? 'error' : ''}`;
                notification.innerHTML = `${message} <span class="close">×</span>`;
                notifications.appendChild(notification);

                setTimeout(() => {
                    notification.remove();
                }, 5000);

                notification.querySelector('.close').addEventListener('click', () => {
                    notification.remove();
                });
            }

            // Resize Handler
            window.addEventListener('resize', () => {
                adjustStationsForMobile();
                updateLiveBuses();
            });
        });