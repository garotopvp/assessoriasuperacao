import React from "react";
import { CheckCircle, ShoppingBag, ArrowRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function ShopSucesso() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-black selection:text-white flex flex-col">
      {/* Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase">Superação Assessoria</h1>
          </div>
          <Link to="/roupas" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ShoppingBag strokeWidth={1.5} className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce transition-all duration-700">
            <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={2} />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-tight">
            Obrigado pelo pagamento!
          </h1>

          <p className="text-gray-500 mb-8 text-lg">Seu pedido foi registrado com sucesso.</p>

          <div className="flex flex-col gap-3">
            <Link
              to="/roupas"
              className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Voltar para Loja <ArrowRight size={18} />
            </Link>

            <Link
              to="/"
              className="w-full bg-white text-black border border-gray-200 py-4 font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              Ir para Home <Home size={18} />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest">© 2024 Superação Assessoria</p>
      </footer>
    </div>
  );
}
