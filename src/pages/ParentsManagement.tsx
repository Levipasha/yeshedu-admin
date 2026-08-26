import { useState, useEffect } from 'react';
import { StudentDetailModal } from './StudentDetailModal';
import { UploadReportCardModal } from './UploadReportCardModal';
import { adminAuth } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const ParentsManagement = () => {
  const [parents, setParents] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectItem, setInspectItem] = useState<{ student?: any, parent?: any } | null>(null);
  const [uploadUser, setUploadUser] = useState<any | null>(null);

  // Link Student Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTargetParent, setLinkTargetParent] = useState<any>(null);
  const [newStudentId, setNewStudentId] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState('');

  // Edit Parent Modal State
  const [editParent, setEditParent] = useState<any | null>(null);
  const [editParentFormData, setEditParentFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentId: ''
  });
  const [updatingParent, setUpdatingParent] = useState(false);

  // Add Parent Modal State
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [parentFormData, setParentFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    studentId: ''
  });
  const [parentSubmitting, setParentSubmitting] = useState(false);
  const [addParentError, setAddParentError] = useState('');

  const fetchParentsAndStudents = async () => {
    setLoading(true);
    try {
      const [parentsRes, studentsRes] = await Promise.all([
        fetch('http://localhost:5000/api/users?role=parent'),
        fetch('http://localhost:5000/api/users?role=student')
      ]);

      const parentsData = await parentsRes.json();
      const studentsData = await studentsRes.json();

      setParents(Array.isArray(parentsData) ? parentsData : []);

      const map: Record<string, any> = {};
      if (Array.isArray(studentsData)) {
        studentsData.forEach(student => {
          if (student.studentId) {
            map[student.studentId.trim()] = student;
          }
        });
      }
      setStudentsMap(map);
    } catch (err) {
      console.error('Error fetching parents/students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentsAndStudents();
  }, []);

  const handleOpenEditParent = (parent: any) => {
    setEditParent(parent);
    setEditParentFormData({
      fullName: parent.fullName || '',
      email: parent.email || '',
      phone: parent.phone || '',
      studentId: parent.studentId || ''
    });
  };

  const handleUpdateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParent) return;

    setUpdatingParent(true);
    try {
      const res = await fetch(`http://localhost:5000/api/users/${editParent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editParentFormData.fullName.trim(),
          email: editParentFormData.email.trim(),
          phone: editParentFormData.phone.trim(),
          studentId: editParentFormData.studentId.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update parent details');
      }

      await fetchParentsAndStudents();
      setEditParent(null);
    } catch (err: any) {
      console.error('Error updating parent:', err);
      alert(err.message || 'Failed to update parent record.');
    } finally {
      setUpdatingParent(false);
    }
  };

  const handleDeleteParent = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete parent account "${email}"?`)) {
      return;
    }

    try {
      if (id) {
        await fetch(`http://localhost:5000/api/users/${id}`, {
          method: 'DELETE'
        });
      }
      await fetchParentsAndStudents();
    } catch (err) {
      console.error('Failed to delete parent account:', err);
      alert('Error deleting parent account.');
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTargetParent || !linkTargetParent.email) return;
    
    setLinkSubmitting(true);
    setLinkError('');

    try {
      const res = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(linkTargetParent.email)}?role=parent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: newStudentId.trim() })
      });

      if (!res.ok) {
        throw new Error('Failed to update student link');
      }

      await fetchParentsAndStudents();
      setIsLinkModalOpen(false);
      setLinkTargetParent(null);
      setNewStudentId('');
    } catch (err: any) {
      console.error('Error linking student:', err);
      setLinkError(err.message || 'Error updating student link');
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentFormData.fullName || !parentFormData.email || !parentFormData.password) return;

    setParentSubmitting(true);
    setAddParentError('');

    try {
      const trimmedEmail = parentFormData.email.trim();
      const userCredential = await createUserWithEmailAndPassword(
        adminAuth, 
        trimmedEmail, 
        parentFormData.password
      );
      
      const firebaseUid = userCredential.user.uid;
      await signOut(adminAuth);

      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: firebaseUid,
          fullName: parentFormData.fullName.trim(),
          email: trimmedEmail,
          role: 'parent',
          studentId: parentFormData.studentId.trim(),
          phone: parentFormData.phone.trim(),
          status: 'Active'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create parent in database');
      }

      await fetchParentsAndStudents();
      setIsAddParentModalOpen(false);
      setParentFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        studentId: ''
      });
    } catch (err: any) {
      console.error('Error adding parent:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAddParentError('This email is already registered. Please use a different one or login.');
      } else if (err.code === 'auth/weak-password') {
        setAddParentError('Password should be at least 6 characters.');
      } else {
        setAddParentError(err.message || 'Error adding parent record');
      }
    } finally {
      setParentSubmitting(false);
    }
  };

  const filteredParents = parents.filter(p => {
    const studentName = p.studentId && studentsMap[p.studentId.trim()] ? studentsMap[p.studentId.trim()].fullName : '';
    const query = searchTerm.toLowerCase();
    return (
      (p.fullName || '').toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.studentId || '').toLowerCase().includes(query) ||
      studentName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Parents Management</h2>
          <p className="text-sm text-gray-500">View registered parent accounts and their linked student details</p>
        </div>
        <button 
          onClick={() => setIsAddParentModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-colors text-sm"
        >
          + Add Parent
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by parent email, student name, or Student ID..." 
            className="w-full md:w-80 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
          <span className="text-xs text-gray-500 font-medium">
            Total Parent Accounts: {parents.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Parent Email</th>
                <th className="px-6 py-4 font-bold">Parent Name</th>
                <th className="px-6 py-4 font-bold text-red-700 bg-red-50/50">Student Name</th>
                <th className="px-6 py-4 font-bold">Linked Student ID</th>
                <th className="px-6 py-4 font-bold">Phone</th>
                <th className="px-6 py-4 font-bold">Joined Date</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    Loading parent accounts and linked student details...
                  </td>
                </tr>
              ) : filteredParents.length > 0 ? (
                filteredParents.map((parent) => {
                  const linkedStudent = parent.studentId ? studentsMap[parent.studentId.trim()] : null;
                  return (
                    <tr key={parent._id || parent.email} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{parent.email}</td>
                      <td className="px-6 py-4 text-gray-700">{parent.fullName || 'Parent Account'}</td>
                      
                      {/* Student Name Column */}
                      <td className="px-6 py-4 font-bold text-red-900 bg-red-50/20">
                        {linkedStudent ? (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">
                              {linkedStudent.fullName.charAt(0)}
                            </span>
                            <span>{linkedStudent.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-normal italic text-xs">
                            {parent.studentId ? 'Student record pending' : 'No student linked'}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {parent.studentId ? (
                          <span className="font-mono font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg text-xs border border-red-100">
                            {parent.studentId}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not linked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{parent.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {parent.createdAt ? new Date(parent.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenEditParent(parent)}
                          className="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg text-xs transition-colors border border-amber-200 whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setLinkTargetParent(parent);
                            setNewStudentId(parent.studentId || '');
                            setIsLinkModalOpen(true);
                          }}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors border border-red-200 whitespace-nowrap"
                        >
                          {parent.studentId ? 'Change Link' : 'Link Student'}
                        </button>
                        <button 
                          onClick={() => setUploadUser(linkedStudent || parent)}
                          className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors border border-red-200 whitespace-nowrap"
                        >
                          Upload Report Card
                        </button>
                        <button 
                          onClick={() => handleDeleteParent(parent._id, parent.email)}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors border border-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    No registered parent accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {inspectItem && (
        <StudentDetailModal 
          student={inspectItem.student}
          parent={inspectItem.parent}
          onClose={() => setInspectItem(null)}
        />
      )}

      {/* Upload Report Card Modal */}
      {uploadUser && (
        <UploadReportCardModal 
          userEmail={uploadUser.email}
          userName={uploadUser.fullName || uploadUser.name || uploadUser.email}
          onClose={() => setUploadUser(null)}
          onSuccess={() => {
            setUploadUser(null);
            fetchParentsAndStudents();
          }}
        />
      )}

      {/* Edit Parent Modal */}
      {editParent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Parent Details</h3>

            <form onSubmit={handleUpdateParent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Parent Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={editParentFormData.fullName}
                  onChange={(e) => setEditParentFormData({...editParentFormData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={editParentFormData.email}
                  onChange={(e) => setEditParentFormData({...editParentFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editParentFormData.phone}
                  onChange={(e) => setEditParentFormData({...editParentFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Linked Student ID</label>
                <input 
                  type="text" 
                  value={editParentFormData.studentId}
                  onChange={(e) => setEditParentFormData({...editParentFormData, studentId: e.target.value})}
                  placeholder="e.g. YEDU-2026-1234"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditParent(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updatingParent}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {updatingParent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Student Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Link Student Account</h3>
            <p className="text-sm text-gray-500 mb-4">
              Linking student to parent: <strong className="text-gray-900">{linkTargetParent?.fullName || linkTargetParent?.email}</strong>
            </p>
            
            {linkError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl mb-4">
                {linkError}
              </div>
            )}

            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Student ID *</label>
                <input 
                  type="text" 
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="e.g. YEDU-2026-1234"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={linkSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {linkSubmitting ? 'Saving...' : 'Save Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Parent Modal */}
      {isAddParentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Parent</h3>
            
            {addParentError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl mb-4">
                {addParentError}
              </div>
            )}

            <form onSubmit={handleAddParent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={parentFormData.fullName}
                  onChange={(e) => setParentFormData({...parentFormData, fullName: e.target.value})}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={parentFormData.email}
                  onChange={(e) => setParentFormData({...parentFormData, email: e.target.value})}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input 
                    type={showParentPassword ? "text" : "password"} 
                    required
                    value={parentFormData.password}
                    onChange={(e) => setParentFormData({...parentFormData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowParentPassword(!showParentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title={showParentPassword ? "Hide password" : "Show password"}
                  >
                    {showParentPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-4.243-4.243L3 3" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={parentFormData.phone}
                  onChange={(e) => setParentFormData({...parentFormData, phone: e.target.value})}
                  placeholder="+1 555-0199"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Linked Student ID (Optional)</label>
                <input 
                  type="text" 
                  value={parentFormData.studentId}
                  onChange={(e) => setParentFormData({...parentFormData, studentId: e.target.value})}
                  placeholder="e.g. YEDU-2026-1234"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddParentModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={parentSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {parentSubmitting ? 'Creating...' : 'Create Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
