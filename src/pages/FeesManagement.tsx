import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export const FeesManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [cyclesMap, setCyclesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for configuring a fee cycle
  const [cycleForm, setCycleForm] = useState({
    feeAmount: 2000,
    feeType: 'Monthly Tuition',
    cycleDays: 30,
    nextDueDate: new Date().toISOString().split('T')[0]
  });

  const [saveMessage, setSaveMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  const fetchStudents = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userEmail) headers['user-email'] = userEmail;

    try {
      const [stRes, cyclesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users?role=student`),
        fetch(`${API_BASE_URL}/api/fees/cycles`, { headers })
      ]);


      const data = await stRes.json();
      const stList = Array.isArray(data) ? data : [];
      setStudents(stList);

      if (cyclesRes.ok) {
        const cyclesData = await cyclesRes.json();
        if (Array.isArray(cyclesData)) {
          const map: Record<string, any> = {};
          cyclesData.forEach((c) => {
            const sKey = typeof c.studentId === 'object' && c.studentId?._id ? c.studentId._id : c.studentId;
            if (sKey) map[sKey.toString()] = c;
          });
          setCyclesMap(map);
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleStartConfigure = (student: any) => {
    const existing = cyclesMap[student._id] || (student.studentId ? cyclesMap[student.studentId] : null);
    if (existing) {
      setCycleForm({
        feeAmount: existing.feeAmount || 2000,
        feeType: existing.feeType || 'Monthly Tuition',
        cycleDays: existing.cycleDays || 30,
        nextDueDate: existing.nextDueDate ? new Date(existing.nextDueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
    setEditingId(student._id);
  };

  const handleCreateCycle = async (studentId: string) => {
    setSaveMessage({ type: '', text: '' });
    
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (userEmail) {
      headers['user-email'] = userEmail;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/fees/cycle`, {

        method: 'POST',
        headers,
        body: JSON.stringify({
          studentId,
          feeAmount: Number(cycleForm.feeAmount),
          feeType: cycleForm.feeType,
          cycleDays: Number(cycleForm.cycleDays),
          nextDueDate: cycleForm.nextDueDate
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create fee cycle');
      }

      setSaveMessage({ type: 'success', text: `Fee cycle configured successfully!` });
      setEditingId(null);
      await fetchStudents();
    } catch (err: any) {
      console.error('Error creating fee cycle:', err);
      setSaveMessage({ type: 'error', text: err.message || 'Error configuring fee cycle.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fees Configuration & Cycles</h2>
          <p className="text-sm text-gray-500">Configure recurring fee cycles for students.</p>
        </div>
      </div>

      {saveMessage.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex justify-between items-center ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{saveMessage.text}</span>
          <button onClick={() => setSaveMessage({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-base">Students</h3>
          <span className="text-xs font-medium text-gray-500">Total Records: {students.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 font-bold text-red-700">Student ID</th>
                <th className="px-6 py-4 font-bold text-gray-700">Configuration</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Loading students...</td>
                </tr>
              ) : students.length > 0 ? (
                students.map((st) => {
                  const isEditing = editingId === st._id;
                  const activeCycle = cyclesMap[st._id] || (st.studentId ? cyclesMap[st.studentId] : null);

                  return (
                    <tr key={st._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <div>
                          <p>{st.fullName}</p>
                          <p className="text-xs text-gray-400 font-normal">{st.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-red-700">
                        {st.studentId || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <input 
                              type="number" 
                              value={cycleForm.feeAmount}
                              onChange={(e) => setCycleForm({ ...cycleForm, feeAmount: Number(e.target.value) })}
                              placeholder="Amount (₹)"
                              className="px-2 py-1 border rounded"
                            />
                            <input 
                              type="text" 
                              value={cycleForm.feeType}
                              onChange={(e) => setCycleForm({ ...cycleForm, feeType: e.target.value })}
                              placeholder="Fee Type"
                              className="px-2 py-1 border rounded"
                            />
                            <select 
                              value={cycleForm.cycleDays}
                              onChange={(e) => setCycleForm({ ...cycleForm, cycleDays: Number(e.target.value) })}
                              className="px-2 py-1 border rounded"
                            >
                              <option value={7}>Weekly (7 days)</option>
                              <option value={15}>Bi-weekly (15 days)</option>
                              <option value={30}>Monthly (30 days)</option>
                              <option value={90}>Quarterly (90 days)</option>
                            </select>
                            <input 
                              type="date" 
                              value={cycleForm.nextDueDate}
                              onChange={(e) => setCycleForm({ ...cycleForm, nextDueDate: e.target.value })}
                              className="px-2 py-1 border rounded"
                            />
                          </div>
                        ) : activeCycle ? (
                          <div className="text-xs bg-red-50/80 text-red-950 p-2.5 rounded-xl border border-red-100 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-red-900">{activeCycle.feeType || 'Tuition Fee'}</span>
                              <span className="font-extrabold text-[var(--color-primary)] text-sm">₹{activeCycle.feeAmount}</span>
                            </div>
                            <p className="text-[11px] text-gray-600">
                              Every {activeCycle.cycleDays} days • Next Due: <strong className="text-red-700">{new Date(activeCycle.nextDueDate).toLocaleDateString()}</strong>
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No active cycle • Click Configure to set up</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCreateCycle(st._id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs"
                            >
                              Save Cycle
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartConfigure(st)}
                            className={`px-3 py-1 font-bold rounded-lg text-xs border ${
                              activeCycle ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                            }`}
                          >
                            {activeCycle ? 'Edit Cycle' : 'Configure Cycle'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
