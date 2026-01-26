
import React, { useState, useRef } from 'react';
import { CreditCard, TrendingUp, AlertCircle, Trophy, DollarSign, RotateCcw, ShoppingCart, Settings, Calendar, Download, FileText, Lightbulb, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import html2pdf from 'html2pdf.js';

export default function CreditCardPlanner() {
  const [gameState, setGameState] = useState('setup');
  const [balance, setBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [monthlyRate, setMonthlyRate] = useState(0.05);
  const [totalInterestPaid, setTotalInterestPaid] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCellMenu, setShowCellMenu] = useState(null);
  
  const [customPayment, setCustomPayment] = useState('');
  const [additionalPayment, setAdditionalPayment] = useState('');
  
  const [cutoffDay, setCutoffDay] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  
  const [planMonths, setPlanMonths] = useState(6);
  const [paymentPlan, setPaymentPlan] = useState(Array(6).fill(''));
  const chartRef = useRef(null);

  const minPayment = Math.max(balance * 0.05, 25);
  const availableCredit = creditLimit - balance;
  const annualRate = (monthlyRate * 12 * 100).toFixed(1);

  const getFinancialTips = () => {
    const debtRatio = (balance / creditLimit) * 100;
    
    if (debtRatio >= 80) {
      return {
        severity: 'critical',
        icon: '🚨',
        title: 'Deuda Muy Alta',
        tips: [
          '• Tu deuda está muy alta. Es momento de actuar rápidamente.',
          '• Considera hacer pagos extras si es posible para reducir intereses.',
          '• Evita nuevas compras hasta reducir el balance significativamente.',
          '• Si no puedes pagar, contacta a tu banco para negociar opciones.'
        ]
      };
    } else if (debtRatio >= 50) {
      return {
        severity: 'warning',
        icon: '⚠️',
        title: 'Deuda Moderada',
        tips: [
          '• Tu deuda está en nivel moderado. Necesitas un plan firme.',
          '• Intenta pagar más que el mínimo cada mes.',
          '• Calcula cuánto pagarías en intereses vs pago mínimo.',
          '• Limita nuevas compras hasta saldar la deuda.'
        ]
      };
    } else if (debtRatio > 0) {
      return {
        severity: 'info',
        icon: 'ℹ️',
        title: 'Deuda Manejable',
        tips: [
          '• Tu deuda está bajo control. ¡Así se hace!',
          '• Sigue pagando regularmente para evitar acumular intereses.',
          '• Un pago adicional mensual aceleraría tu liberación de deuda.',
          '• Mantén tu utilización de crédito por debajo del 30%.'
        ]
      };
    } else {
      return {
        severity: 'success',
        icon: '✅',
        title: 'Sin Deudas',
        tips: [
          '• ¡Felicidades! No tienes deuda en la tarjeta.',
          '• Usa tu tarjeta de crédito responsablemente.',
          '• Paga el saldo completo cada mes para evitar intereses.',
          '• Construye un historial crediticio sólido.'
        ]
      };
    }
  };

  const autoFillPaymentPlan = (type) => {
    if (type === 'minimum') {
      // Llenar con pago mínimo
      const newPlan = Array(planMonths).fill(minPayment.toFixed(2));
      setPaymentPlan(newPlan);
    } else if (type === 'graduated') {
      // Pagos escalonados para saldar en el período seleccionado
      let remainingBalance = balance;
      const graduatedPlan = [];
      
      for (let i = 0; i < planMonths; i++) {
        const monthsLeft = planMonths - i;
        const interest = remainingBalance * monthlyRate;
        const payment = (remainingBalance + interest) / monthsLeft;
        graduatedPlan.push(Math.max(payment, minPayment).toFixed(2));
        remainingBalance -= (payment - interest);
      }
      setPaymentPlan(graduatedPlan);
    }
  };

  const fillCellWithPercentage = (cellIndex, percentage) => {
    const newPlan = [...paymentPlan];
    const cellPayment = minPayment * (1 + percentage / 100);
    newPlan[cellIndex] = cellPayment.toFixed(2);
    setPaymentPlan(newPlan);
    setShowCellMenu(null);
  };

  const calculatePlanProjection = () => {
    const projection = [];
    let remainingBalance = balance;
    let totalInterest = totalInterestPaid;
    
    for (let i = 0; i < planMonths; i++) {
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
    setPlanMonths(6);
    setPaymentPlan(Array(6).fill(''));
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
    const element = document.getElementById('pdf-content');
    if (!element) {
      alert('No se puede generar el PDF. Intenta nuevamente.');
      return;
    }

    const opt = {
      margin: 10,
      filename: `plan_pagos_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
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
                    onChange={(e) => setCutoffDay(e.target.value === '' ? '' : Math.max(1, Math.min(28, parseInt(e.target.value))))}
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
                    onChange={(e) => setPaymentDueDay(e.target.value === '' ? '' : Math.max(1, Math.min(31, parseInt(e.target.value))))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="31"
                  />
                  <div className="text-sm text-gray-500 mt-1">Día del mes siguiente</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Límite de Crédito ($)</label>
                  <input
                    type="number"
                    value={creditLimit || ''}
                    onChange={(e) => setCreditLimit(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Balance Actual ($)</label>
                  <input
                    type="number"
                    value={balance || ''}
                    onChange={(e) => setBalance(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  {balance > creditLimit && (
                    <div className="text-sm text-red-600 mt-1 font-medium">
                      ⚠️ Sobregiro: ${(balance - creditLimit).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Tasa de Interés Mensual (%)</label>
                <input
                  type="number"
                  value={(monthlyRate * 100).toFixed(2)}
                  onChange={(e) => setMonthlyRate(Math.max(0, parseFloat(e.target.value) || 0) / 100)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  step="0.1"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Anual: {annualRate}%
                </div>
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
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
                    onChange={(e) => setCreditLimit(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
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
              <div className="text-xs opacity-75 mt-1">{creditLimit > 0 ? ((balance / creditLimit) * 100).toFixed(1) : '0'}% {balance > creditLimit ? 'sobregiro' : 'usado'}</div>
            </div>
            <div className={`bg-gradient-to-br rounded-lg p-4 text-white ${availableCredit >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-600 to-red-700'}`}>
              <div className="text-xs opacity-90 mb-1">{availableCredit >= 0 ? 'Crédito Disponible' : '🚨 Sobregiro'}</div>
              <div className="text-xl font-bold">${Math.abs(availableCredit).toFixed(2)}</div>
              <div className="text-xs opacity-75 mt-1">{availableCredit >= 0 ? `de $${creditLimit}` : 'excedido'}</div>
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
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">Aviso Importante</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Estos cálculos son estimados y no incluyen cargos extras aplicables como sobregiros, anualidades, cargos por financiamiento, etc. Consulta con tu banco para obtener información completa.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Plan de Pagos</h3>
              <select
                value={planMonths}
                onChange={(e) => {
                  const newMonths = parseInt(e.target.value);
                  setPlanMonths(newMonths);
                  setPaymentPlan(Array(newMonths).fill(''));
                }}
                className="ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              >
                <option value="6">6 meses</option>
                <option value="12">12 meses</option>
              </select>
            </div>
            
            <div className="mb-4" style={{display: 'grid', gridTemplateColumns: `repeat(${planMonths === 6 ? 3 : 6}, minmax(0, 1fr))`, gap: '0.5rem'}}>
              {paymentPlan.map((payment, index) => (
                <div key={index} className="flex flex-col relative">
                  <label className="text-xs font-medium text-gray-600 mb-1">M{index + 1}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={payment}
                      onChange={(e) => {
                        const newPlan = [...paymentPlan];
                        newPlan[index] = e.target.value;
                        setPaymentPlan(newPlan);
                      }}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="$0"
                      min="0"
                    />
                    <button
                      onClick={() => setShowCellMenu(showCellMenu === index ? null : index)}
                      className="absolute right-0 top-0 h-full px-2 text-gray-500 hover:text-indigo-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showCellMenu === index && (
                    <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 whitespace-nowrap text-xs">
                      <button
                        onClick={() => fillCellWithPercentage(index, 25)}
                        className="block w-full text-left px-3 py-2 hover:bg-indigo-50 text-gray-700"
                      >
                        Mín +25%
                      </button>
                      <button
                        onClick={() => fillCellWithPercentage(index, 50)}
                        className="block w-full text-left px-3 py-2 hover:bg-indigo-50 text-gray-700"
                      >
                        Mín +50%
                      </button>
                      <button
                        onClick={() => fillCellWithPercentage(index, 75)}
                        className="block w-full text-left px-3 py-2 hover:bg-indigo-50 text-gray-700"
                      >
                        Mín +75%
                      </button>
                      <button
                        onClick={() => fillCellWithPercentage(index, 100)}
                        className="block w-full text-left px-3 py-2 hover:bg-indigo-50 text-gray-700"
                      >
                        Doble Mín
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
              <button
                onClick={() => autoFillPaymentPlan('minimum')}
                className="flex-1 min-w-[150px] px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
              >
                📊 Llenar Mínimo
              </button>
              <button
                onClick={() => autoFillPaymentPlan('graduated')}
                className="flex-1 min-w-[150px] px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
              >
                📈 Pagos Escalonados
              </button>
              <button
                onClick={() => {
                  setPaymentPlan(Array(planMonths).fill(''));
                  setShowCellMenu(null);
                }}
                className="flex-1 min-w-[150px] px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">📊 Proyección del Plan</h3>
            
            {planProjection[planMonths - 1]?.balance > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">⚠️ Estos pagos no son suficientes</h3>
                    <p className="text-sm text-red-800 mt-1">
                      Estos pagos no son suficientes para saldar el monto total adeudado en el tiempo establecido. Al finalizar el mes {planMonths}, aún quedaría un saldo de ${planProjection[planMonths - 1]?.balance.toFixed(2)}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {planProjection.some(p => p.payment > 0 && p.payment < minPayment * 0.8) && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">⚠️ Advertencia de Pago Bajo</h3>
                    <p className="text-sm text-red-800 mt-1">
                      Algunos de tus pagos están por debajo del pago mínimo recomendado (${minPayment.toFixed(2)}). Esto causará que los intereses aumenten significativamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div id="pdf-content" className="bg-white p-4 rounded-lg">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={planProjection} ref={chartRef}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    label={{ value: 'Mes', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }} 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Intereses ($)', angle: 90, position: 'insideRight' }}
                  />
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
                  <Line yAxisId="left" type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} name="Balance" />
                  <Line yAxisId="right" type="monotone" dataKey="totalInterest" stroke="#ef4444" strokeWidth={2} name="Intereses Acumulados" />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="flex justify-around mt-4 px-4 flex-wrap gap-2">
                {planProjection.slice(0, 12).map((data, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl">{data.emoji}</div>
                    <div className="text-xs text-gray-500">M{data.month}</div>
                  </div>
                ))}
              </div>
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

          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Consejos Financieros
            </h3>
            
            {(() => {
              const tips = getFinancialTips();
              return (
                <div className={`border-l-4 rounded-lg p-5 ${
                  tips.severity === 'critical' ? 'bg-red-50 border-red-500' :
                  tips.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  tips.severity === 'info' ? 'bg-blue-50 border-blue-500' :
                  'bg-green-50 border-green-500'
                }`}>
                  <h4 className={`font-semibold text-lg mb-3 ${
                    tips.severity === 'critical' ? 'text-red-900' :
                    tips.severity === 'warning' ? 'text-yellow-900' :
                    tips.severity === 'info' ? 'text-blue-900' :
                    'text-green-900'
                  }`}>
                    {tips.icon} {tips.title}
                  </h4>
                  <div className={`text-sm space-y-2 ${
                    tips.severity === 'critical' ? 'text-red-800' :
                    tips.severity === 'warning' ? 'text-yellow-800' :
                    tips.severity === 'info' ? 'text-blue-800' :
                    'text-green-800'
                  }`}>
                    {tips.tips.map((tip, index) => (
                      <p key={index}>{tip}</p>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-3">📚 Educación Financiera</h4>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>✓ Paga siempre antes del vencimiento para evitar cargos</li>
                  <li>✓ Utiliza máximo 30% de tu límite de crédito</li>
                  <li>✓ Los intereses compuesto aumentan exponencialmente</li>
                  <li>✓ Cada pago extra reduce significativamente los intereses</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-3">💡 Acciones Recomendadas</h4>
                <ul className="text-sm text-orange-800 space-y-2">
                  <li>✓ Establece un recordatorio para tus pagos</li>
                  <li>✓ Intenta pagar más que el mínimo cada mes</li>
                  <li>✓ Revisa tu estado de cuenta regularmente</li>
                  <li>✓ Contacta a tu banco si tienes dificultades de pago</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
