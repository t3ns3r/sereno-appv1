import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8 text-center">
        {/* SERENITO Character */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-6xl">
            🤖
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">¡Hola! Soy SERENITO</h1>
          <p className="text-xl text-gray-600">Tu compañero de bienestar mental</p>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Bienvenido a SERENO
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Una aplicación diseñada especialmente para el apoyo y seguimiento 
            de personas con trastornos de salud mental.
          </p>
          
          {/* Large Buttons for Seniors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors">
              🧠 Evaluación de Estado de Ánimo
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors">
              🫁 Ejercicios de Respiración
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors">
              📊 Seguimiento Diario
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors">
              🚨 Emergencia
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-800 mb-2">Fácil de Usar</h3>
            <p className="text-gray-600">Interfaz diseñada para personas mayores con botones grandes y navegación simple.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl mb-3">💙</div>
            <h3 className="font-semibold text-gray-800 mb-2">Apoyo Constante</h3>
            <p className="text-gray-600">SERENITO te acompaña en tu proceso de bienestar mental las 24 horas.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-800 mb-2">Privacidad Segura</h3>
            <p className="text-gray-600">Tus datos están protegidos con los más altos estándares de seguridad.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-gray-500">
          <p>SERENO v1.0 - Aplicación funcionando correctamente ✅</p>
        </div>
      </div>
    </div>
  );
}

export default App;