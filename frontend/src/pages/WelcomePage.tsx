import React from 'react';

const WelcomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
      <div className="w-24 h-24 bg-orbit-primary/20 rounded-full flex items-center justify-center mb-6">
        <img 
            src={`${window.location.origin}/espritlogo.jpg`} 
            alt="Logo Esprit" 
            className="w-16 h-16 object-contain" 
        />
      </div>
      <h1 className="text-4xl font-bold text-slate-100 mb-4">Bienvenue sur espritEvent</h1>
      <p className="text-xl text-slate-400 max-w-2xl">
        La plateforme intelligente de gestion d'événements. 
        Utilisez le menu à gauche pour gérer les événements, les réservations et les tickets.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="p-6 bg-orbit-surface border border-orbit-border rounded-xl">
          <h3 className="text-orbit-primary-light font-bold mb-2">Événements</h3>
          <p className="text-sm text-slate-500">Planifiez et organisez vos sessions.</p>
        </div>
        <div className="p-6 bg-orbit-surface border border-orbit-border rounded-xl">
          <h3 className="text-orbit-primary-light font-bold mb-2">Réservations</h3>
          <p className="text-sm text-slate-500">Suivez les inscriptions en temps réel.</p>
        </div>
        <div className="p-6 bg-orbit-surface border border-orbit-border rounded-xl">
          <h3 className="text-orbit-primary-light font-bold mb-2">Tickets</h3>
          <p className="text-sm text-slate-500">Gérez les accès et les QR Codes.</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;