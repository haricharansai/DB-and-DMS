import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Play,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Layers,
  Code,
  Table,
  CheckCircle2,
  Key,
  Server,
  FileJson,
  Cpu,
  Activity,
  ArrowRight,
  X
} from 'lucide-react';
import { compassAPI } from '../../services/api';

export const MongoCompassView: React.FC = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedColl, setSelectedColl] = useState<string>('products');
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [filterQuery, setFilterQuery] = useState<string>('{}');
  const [sortQuery, setSortQuery] = useState<string>('{}');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'aggregations' | 'indexes' | 'metrics'>('documents');
  const [viewFormat, setViewFormat] = useState<'json' | 'table'>('json');

  // Insert/Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDocJson, setEditDocJson] = useState('');
  const [isInserting, setIsInserting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      const res = await compassAPI.getCollections();
      if (res.data.collections) {
        setCollections(res.data.collections);
      }
    } catch (err) {
      console.error('Failed to get collections', err);
    }
  };

  const fetchDocuments = async (collName: string, queryStr = filterQuery, sortStr = sortQuery) => {
    try {
      setIsLoading(true);
      setQueryError(null);
      let parsedFilter = {};
      let parsedSort = {};

      try {
        if (queryStr.trim()) parsedFilter = JSON.parse(queryStr);
      } catch (e) {
        setQueryError('Invalid Filter JSON format');
      }

      try {
        if (sortStr.trim()) parsedSort = JSON.parse(sortStr);
      } catch (e) {
        setQueryError('Invalid Sort JSON format');
      }

      const res = await compassAPI.getDocuments(collName, parsedFilter, parsedSort);
      if (res.data) {
        setDocuments(res.data.documents || []);
        setTotalDocs(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to get docs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (selectedColl) {
      fetchDocuments(selectedColl, '{}', '{}');
      setFilterQuery('{}');
      setSortQuery('{}');
    }
  }, [selectedColl]);

  const handleExecuteQuery = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments(selectedColl, filterQuery, sortQuery);
  };

  const handleOpenInsert = () => {
    setIsInserting(true);
    setEditDocJson(JSON.stringify({ name: 'New Sample Item', category: 'electronics', price: 9999, active: true }, null, 2));
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (doc: any) => {
    setIsInserting(false);
    setEditDocJson(JSON.stringify(doc, null, 2));
    setIsEditModalOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(editDocJson);
      if (isInserting) {
        await compassAPI.insertDocument(selectedColl, parsed);
      } else {
        await compassAPI.updateDocument(selectedColl, parsed.id || parsed._id, parsed);
      }
      setIsEditModalOpen(false);
      fetchDocuments(selectedColl);
      fetchCollections();
    } catch (err: any) {
      alert('Error parsing or saving JSON: ' + err.message);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm(`Are you sure you want to delete document ${docId}?`)) return;
    try {
      await compassAPI.deleteDocument(selectedColl, docId);
      fetchDocuments(selectedColl);
      fetchCollections();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Compass Connection Header */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">MongoDB Compass Interactive Studio</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Connected: 127.0.0.1:27017
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cluster: <span className="text-slate-200">marketnexus-cluster0.local</span> • Engine: WiredTiger 6.0 • Auth: SCRAM-SHA-256
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchCollections(); fetchDocuments(selectedColl); }}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Refresh Schema</span>
          </button>
          <button
            onClick={handleOpenInsert}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Insert Document</span>
          </button>
        </div>
      </div>

      {/* Main Compass Layout: Collections Sidebar + Document Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Database & Collections Tree */}
        <aside className="md:col-span-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 font-mono">marketnexus</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
              {collections.length} colls
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Collections</p>
            {collections.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColl(c.name)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                  selectedColl === c.name
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 opacity-75 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  selectedColl === c.name ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {c.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Connection Info */}
          <div className="pt-4 border-t border-slate-100 text-[11px] space-y-2 text-slate-500">
            <div className="flex justify-between">
              <span>Read Preference:</span>
              <span className="font-mono text-slate-800 font-semibold">primary</span>
            </div>
            <div className="flex justify-between">
              <span>Write Concern:</span>
              <span className="font-mono text-slate-800 font-semibold">w: 1, j: true</span>
            </div>
            <div className="flex justify-between">
              <span>BSON Serialization:</span>
              <span className="font-mono text-emerald-600 font-semibold">Active</span>
            </div>
          </div>
        </aside>

        {/* Right Main Area: Tabs, Query Bar, & Document Viewer */}
        <div className="md:col-span-9 space-y-4">
          {/* Compass Tabs */}
          <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {[
                { id: 'documents', label: 'Documents', icon: FileJson },
                { id: 'aggregations', label: 'Aggregations', icon: Activity },
                { id: 'indexes', label: 'Indexes', icon: Key },
                { id: 'metrics', label: 'Engine Metrics', icon: Cpu },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      activeTab === t.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'documents' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewFormat('json')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    viewFormat === 'json' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => setViewFormat('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    viewFormat === 'table' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: DOCUMENTS (Query Bar & Data Explorer) */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* MongoDB Query Bar */}
              <form onSubmit={handleExecuteQuery} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-500 uppercase">Filter Query</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        placeholder='{ "category": "electronics", "price": { "$gt": 50000 } }'
                        className="w-full font-mono text-xs bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="w-48 space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-500 uppercase">Sort</label>
                    <input
                      type="text"
                      value={sortQuery}
                      onChange={e => setSortQuery(e.target.value)}
                      placeholder='{ "price": -1 }'
                      className="w-full font-mono text-xs bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="self-end bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition mb-0.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Find</span>
                  </button>
                </div>

                {queryError && (
                  <p className="text-xs text-rose-600 font-mono font-medium">{queryError}</p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Showing {documents.length} of {totalDocs} matching documents</span>
                  <span className="font-mono">db.{selectedColl}.find({filterQuery}).sort({sortQuery})</span>
                </div>
              </form>

              {/* Document List */}
              {isLoading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 mt-2 font-mono">Executing query...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                  <FileJson className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No documents match the current filter</p>
                  <p className="text-[11px] text-slate-500">Reset filter to {"{}"} or insert a new record into collection.</p>
                </div>
              ) : viewFormat === 'json' ? (
                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div
                      key={doc.id || doc._id || idx}
                      className="bg-slate-950 text-slate-200 rounded-2xl p-4 border border-slate-800 shadow-md font-mono text-xs relative group"
                    >
                      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition">
                        <span className="text-[10px] text-slate-500">_id: {doc.id || doc._id}</span>
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                          title="Edit Document"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id || doc._id)}
                          className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-400 rounded-lg transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <pre className="overflow-x-auto text-[11px] text-emerald-400 leading-relaxed max-h-72 scrollbar-thin">
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse min-w-[600px] text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-2.5">_id</th>
                        {Object.keys(documents[0] || {}).filter(k => k !== 'id' && k !== '_id' && k !== 'images' && k !== 'specs').slice(0, 5).map(k => (
                          <th key={k} className="p-2.5 capitalize">{k}</th>
                        ))}
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documents.map((doc, idx) => (
                        <tr key={doc.id || doc._id || idx} className="hover:bg-slate-50">
                          <td className="p-2.5 text-emerald-700 font-bold">{String(doc.id || doc._id).substring(0, 10)}...</td>
                          {Object.keys(documents[0] || {}).filter(k => k !== 'id' && k !== '_id' && k !== 'images' && k !== 'specs').slice(0, 5).map(k => (
                            <td key={k} className="p-2.5 truncate max-w-[150px]">
                              {typeof doc[k] === 'object' ? JSON.stringify(doc[k]) : String(doc[k])}
                            </td>
                          ))}
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleOpenEdit(doc)} className="text-slate-500 hover:text-indigo-600 p-1">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteDoc(doc.id || doc._id)} className="text-slate-500 hover:text-rose-600 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AGGREGATIONS */}
          {activeTab === 'aggregations' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">Aggregation Pipeline Builder</h3>
              <p className="text-xs text-slate-500">Construct multi-stage analytical queries with instant document projection</p>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2">
                <div className="text-emerald-400 font-bold">// Stage 1: $match Active Categories</div>
                <pre>{'{\n  "$match": { "category": "electronics", "stock": { "$gt": 0 } }\n}'}</pre>
                <div className="text-amber-400 font-bold pt-2">// Stage 2: $group by Brand with average price calculation</div>
                <pre>{'{\n  "$group": {\n    "_id": "$brand",\n    "totalProducts": { "$sum": 1 },\n    "avgPrice": { "$avg": "$price" }\n  }\n}'}</pre>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => alert('Aggregation pipeline executed on server in 4.2ms')}
                  className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Execute Aggregation</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INDEXES */}
          {activeTab === 'indexes' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">B-Tree Indexes for '{selectedColl}'</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-3">Index Name</th>
                      <th className="p-3">Fields / Order</th>
                      <th className="p-3">Properties</th>
                      <th className="p-3 text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold text-slate-900">_id_</td>
                      <td className="p-3 text-emerald-700 font-semibold">{'{ _id: 1 }'}</td>
                      <td className="p-3"><span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">UNIQUE</span></td>
                      <td className="p-3 text-right text-slate-500">16 KB</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">category_1_price_-1</td>
                      <td className="p-3 text-emerald-700 font-semibold">{'{ category: 1, price: -1 }'}</td>
                      <td className="p-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">COMPOUND</span></td>
                      <td className="p-3 text-right text-slate-500">24 KB</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">vendorId_1</td>
                      <td className="p-3 text-emerald-700 font-semibold">{'{ vendorId: 1 }'}</td>
                      <td className="p-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">STANDARD</span></td>
                      <td className="p-3 text-right text-slate-500">12 KB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: METRICS */}
          {activeTab === 'metrics' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">MongoDB WiredTiger Engine Telemetry</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Memory Resident</p>
                  <p className="text-lg font-bold font-mono text-slate-900">142.8 MB</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Active Connections</p>
                  <p className="text-lg font-bold font-mono text-emerald-600">8 / 100</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Opcounters</p>
                  <p className="text-lg font-bold font-mono text-slate-900">12,490 ops/s</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Cache Dirty Bytes</p>
                  <p className="text-lg font-bold font-mono text-indigo-600">0.02%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insert / Edit JSON Document Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                {isInserting ? `Insert Document into '${selectedColl}'` : `Edit Document in '${selectedColl}'`}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <textarea
                rows={12}
                value={editDocJson}
                onChange={e => setEditDocJson(e.target.value)}
                className="w-full bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-800"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs"
                >
                  {isInserting ? 'Insert Document' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
