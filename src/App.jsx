
import React, { useState } from 'react';
import { CreditCard, TrendingUp, AlertCircle, Trophy, DollarSign, RotateCcw, ShoppingCart, Settings, Calendar, Download, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function CreditCardPlanner() {
  const [gameState, setGameState] = useState('setup');
  const [balance, setBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(1000);
  const [monthlyRate, setMonthlyRate] = useState(0.05);
  const [totalInterestPaid, setTotalInterestPaid] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [customPayment, setCustomPayment] = useState('');
  const [additionalPayment, setAdditionalPayment] = useState('');
  
  const [cutoffDay, setCutoffDay] = useState('15');
  const [paymentDueDay, setPaymentDueDay] = useState('25');
  
  const [paymentPlan, setPaymentPlan] = useState(Array(12).fill(''));

  const minPayment = Math.max(balance * 0.05, 25);
  const availableCredit = creditLimit - balance;
  const annualRate = (monthlyRate * 12 * 100).toFixed(1);

  const calculatePlanProjection = () => {
    const projection = [];
    let remainingBalance = balance;
    let totalInterest = totalInterestPaid;
    
    for (let i = 0; i < 12; i++) {
      const payment = parseFloat(paymentPlan[i]) || 0;
      
      if (remainingBalance <= 0) {
        projection.push({
          month: i + 1,
          balance: 0,
          payment: 0,
          interest: 0,
          totalInterest: totalInterest,
          emoji: '✅'
        });
        continue;
      }
      
      const interest = remainingBalance * monthlyRate;
      const principal = payment - interest;
      const newBalance = Math.max(remainingBalance - principal, 0);
      totalInterest += interest;
      
      let emoji = '📊';
      if (payment === 0) {
        emoji = '⚠️';
      } else if (newBalance === 0) {
        emoji = '🎉';
      } else if (payment >= minPayment * 1.5) {
        emoji = '🚀';
      } else if (payment >= minPayment) {
        emoji = '👍';
      } else {
        emoji = '⚠️';
      }
      
      projection.push({
        month: i + 1,
        balance: newBalance,
        payment: payment,
        interest: interest,
        totalInterest: totalInterest,
        emoji: emoji
      });
      
      remainingBalance = newBalance;
    }
    
    return projection;
  };

  const planProjection = calculatePlanProjection();
  
  const updatePaymentPlan = (index, value) => {
    const newPlan = [...paymentPlan];
    newPlan[index] = value;
    setPaymentPlan(newPlan);
  };

  const resetSimulation = () => {
    setGameState('setup');
    setBalance(0);
    setTotalInterestPaid(0);
    setAchievements([]);
    setShowWarning(false);
    setShowSettings(false);
    setPaymentPlan(Array(12).fill(''));
  };

  const startSimulation = () => {
    setGameState('playing');
  };

  const calculateProjection = (monthlyPayment, additional = 0) => {
    if (monthlyPayment <= 0 || balance === 0) return { months: 0, totalInterest: 0 };
    
    let projBalance = balance;
    let projInterest = totalInterestPaid;
    let months = 0;
    const maxMonths = 360;

    while (projBalance > 0 && months < maxMonths) {
      const interest = projBalance * monthlyRate;
      const totalPayment = monthlyPayment + additional;
      const principal = totalPayment - interest;
      
      if (principal <= 0) return { months: Infinity, totalInterest: Infinity };
      
      projBalance = Math.max(projBalance - principal, 0);
      projInterest += interest;
      months++;
    }

    return { months, totalInterest: projInterest };
  };

  const minProjection = balance > 0 ? calculateProjection(minPayment) : { months: 0, totalInterest: 0 };
  const recommendedProjection = balance > 0 ? calculateProjection(minPayment * 1.5) : { months: 0, totalInterest: 0 };
  
  const customProjection = balance > 0 && customPayment && parseFloat(customPayment) > 0
    ? calculateProjection(parseFloat(customPayment), parseFloat(additionalPayment) || 0)
    : { months: 0, totalInterest: 0 };

  const achievementsList = {
    big_payment: { icon: '💪', text: 'Pagaste el doble del mínimo' },
    consistent: { icon: '🎯', text: 'Tres pagos consecutivos sobre el mínimo' },
    debt_free: { icon: '🎉', text: '¡Libre de deudas!' }
  };

  const generatePaymentPlan = () => {
    const recommendedPayment = Math.max(minPayment * 1.5, 50);
    const projection = calculateProjection(recommendedPayment);
    
    return {
      balance,
      recommendedPayment: recommendedPayment.toFixed(2),
      months: projection.months,
      totalInterest: projection.totalInterest.toFixed(2),
      monthlySavings: minProjection.months !== Infinity 
        ? ((minProjection.totalInterest - projection.totalInterest) / projection.months).toFixed(2)
        : '0',
      history: planProjection
    };
  };

  const downloadPaymentPlan = () => {
    const plan = generatePaymentPlan();
    const content = `PLAN DE PAGOS RECOMENDADO - TARJETA DE CRÉDITO

📅 Fecha de generación: ${new Date().toLocaleDateString('es-DO')}
💳 Balance actual: $${plan.balance.toFixed(2)}
💰 Pago recomendado mensual: $${plan.recommendedPayment}
⏱️ Meses estimados: ${plan.months}
💸 Intereses totales estimados: $${plan.totalInterest}
📉 Ahorro mensual vs mínimo: $${plan.monthlySavings}

DETALLES DE CONFIGURACIÓN:
• Límite de crédito: $${creditLimit.toLocaleString()}
• Tasa anual: ${annualRate}%
• Día de corte: ${cutoffDay}
• Día límite de pago: ${paymentDueDay}

RECOMENDACIONES:
✅ Paga $${plan.recommendedPayment} mensualmente
✅ Evita nuevas compras hasta saldar la deuda
✅ Marca cada pago en tu calendario
✅ Revisa tu estado de cuenta cada mes

¡Sigue este plan y saldrás de deudas más rápido y con menos intereses!`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan_pagos_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-10 h-10 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">Planificador Financiero</h1>
            </div>
            
            <p className="text-gray-600 mb-8">
              Configura tu tarjeta y simula escenarios de pago para salir de deudas más rápido.
            </p>

            <div className="bg-indigo-50 rounded-lg p-6 mb-6 space-y-6">
              <h2 className="font-semibold text-lg mb-4">Configuración de tu Tarjeta</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Día de Corte</label>
                  <input
                    type="number"
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(Math.max(1, Math.min(28, parseInt(e.target.value) || 15)))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="28"
                  />
                  <div className="text-sm text-gray-500 mt-1">Día del mes (1-28)</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Día Límite de Pago</label>
                  <input
                    type="number"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 25)))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="31"
                  />
                  <div className="text-sm text-gray-500 mt-1">Día del mes siguiente</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Límite de Crédito ($)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tasa de Interés Mensual (%)</label>
                <input
                  type="number"
                  value={(monthlyRate * 100).toFixed(2)}
                  onChange={(e) => setMonthlyRate(Math.max(0, parseFloat(e.target.value) || 0) / 100)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  step="0.1"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Tasa anual: {annualRate}%
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Balance Inicial ($)</label>
                <input
                  type="number"
                  value={balance || ''}
                  onChange={(e) => setBalance(Math.max(0, Math.min(creditLimit, parseFloat(e.target.value) || 0)))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  max={creditLimit}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Resumen</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• Límite: ${creditLimit.toLocaleString()} • Balance: ${balance.toFixed(2)}</div>
                <div>• Tasa: {annualRate}% anual • Corte: día {cutoffDay} • Límite pago: día {paymentDueDay}</div>
              </div>
            </div>

            <button
              onClick={startSimulation}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              🚀 Comenzar Simulación
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Planificador de Pagos</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>📅 Corte: día {cutoffDay}</span>
                  <span className="text-red-600 font-semibold">⏰ Límite pago: día {paymentDueDay}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={downloadPaymentPlan}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Plan Pagos</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Config</span>
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Configuración Actual</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Límite de Crédito ($)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Math.max(balance, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min={balance}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tasa Mensual (%)</label>
                  <input
                    type="number"
                    value={(monthlyRate * 100).toFixed(2)}
                    onChange={(e) => setMonthlyRate(Math.max(0, parseFloat(e.target.value) || 0) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tasa Anual</label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                    {annualRate}%
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="text-xs opacity-90 mb-1">Balance Actual</div>
              <div className="text-xl font-bold">${balance.toFixed(2)}</div>
              <div className="text-xs opacity-75 mt-1">{((balance / creditLimit) * 100).toFixed(1)}% usado</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-white">
              <div className="text-xs opacity-90 mb-1">Crédito Disponible</div>
              <div className="text-xl font-bold">${availableCredit.toFixed(2)}</div>
              <div className="text-xs opacity-75 mt-1">de ${creditLimit}</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-lg p-4 text-white">
              <div className="text-xs opacity-90 mb-1">Intereses Totales</div>
              <div className="text-xl font-bold">${planProjection[planProjection.length - 1]?.totalInterest.toFixed(2) || '0.00'}</div>
              <div className="text-xs opacity-75 mt-1">proyectados</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg p-4 text-white">
              <div className="text-xs opacity-90 mb-1">Pago Mínimo</div>
              <div className="text-xl font-bold">${minPayment.toFixed(2)}</div>
              <div className="text-xs opacity-75 mt-1">5% del balance</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Plan de Pagos (12 meses)
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {paymentPlan.map((payment, index) => (
                <div key={index} className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1">Mes {index + 1}</label>
                  <input
                    type="number"
                    value={payment}
                    onChange={(e) => updatePaymentPlan(index, e.target.value)}
                    className="px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="$0"
                    min="0"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setPaymentPlan(Array(12).fill((minPayment * 1.5).toFixed(2)))}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
              >
                Llenar con Recomendado (${(minPayment * 1.5).toFixed(2)})
              </button>
              <button
                onClick={() => setPaymentPlan(Array(12).fill(''))}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">📊 Proyección del Plan</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={planProjection}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  label={{ value: 'Mes', position: 'insideBottom', offset: -5 }}
                />
                <YAxis label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                          <p className="font-semibold">Mes {data.month} {data.emoji}</p>
                          <p className="text-sm">Pago: ${data.payment.toFixed(2)}</p>
                          <p className="text-sm">Balance: ${data.balance.toFixed(2)}</p>
                          <p className="text-sm">Intereses: ${data.interest.toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} name="Balance" />
                <Line type="monotone" dataKey="totalInterest" stroke="#ef4444" strokeWidth={2} name="Intereses Acumulados" />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="flex justify-around mt-2 px-12">
              {planProjection.slice(0, 12).map((data, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl">{data.emoji}</div>
                  <div className="text-xs text-gray-500">M{data.month}</div>
                </div>
              ))}
            </div>
          </div>

          {balance > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Proyecciones de Pago
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                  <div className="font-medium mb-3">Pago Recomendado (Mínimo + 50%)</div>
                  <div className="text-sm text-gray-700 mb-2">Pago mensual: <span className="font-semibold">${(minPayment * 1.5).toFixed(2)}</span></div>
                  <div className="text-sm text-gray-600">
                    • Tiempo: <span className="font-semibold">{recommendedProjection.months === Infinity ? '∞' : recommendedProjection.months} meses</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    • Intereses totales: <span className="font-semibold text-green-600">${recommendedProjection.totalInterest.toFixed(2)}</span>
                  </div>
                  {minProjection.months !== Infinity && (
                    <div className="text-xs font-semibold text-green-700 mt-2">
                      ✓ Ahorras ${(minProjection.totalInterest - recommendedProjection.totalInterest).toFixed(2)} vs pago mínimo
                    </div>
                  )}
                </div>

                <div className="border-2 border-indigo-300 rounded-lg p-4 bg-indigo-50">
                  <div className="font-medium mb-3">Pago Personalizado</div>
                  <div className="space-y-2 mb-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Pago mensual ($)</label>
                      <input
                        type="number"
                        value={customPayment}
                        onChange={(e) => setCustomPayment(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: 150"
                        min={minPayment}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Aporte adicional mensual ($)</label>
                      <input
                        type="number"
                        value={additionalPayment}
                        onChange={(e) => setAdditionalPayment(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: 50"
                        min="0"
                      />
                    </div>
                  </div>
                  {customProjection.months > 0 && (
                    <div className="border-t border-indigo-200 pt-2">
                      <div className="text-sm text-gray-600">
                        • Tiempo: <span className="font-semibold">{customProjection.months === Infinity ? '∞' : customProjection.months} meses</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        • Intereses totales: <span className="font-semibold text-indigo-600">${customProjection.totalInterest.toFixed(2)}</span>
                      </div>
                      {minProjection.months !== Infinity && (
                        <div className="text-xs font-semibold text-indigo-700 mt-2">
                          ✓ Ahorras ${(minProjection.totalInterest - customProjection.totalInterest).toFixed(2)} vs pago mínimo
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
