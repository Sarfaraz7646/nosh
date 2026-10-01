import { useMemo, useState } from 'react'
import { Check, Pencil, Plus, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { useRestaurantDashboard } from '../hooks/useRestaurantDashboard'
import { restaurantApi } from '../services/restaurantApi'
import { formatCurrency } from '../utils/currency'

const blankItem = { name: '', description: '', category: 'House favourites', price: '', image: '', isVeg: true, isAvailable: true }

export default function DashboardMenuPage() {
  const { menuItems, profile, saveMenuItem, removeMenuItem, syncMenuItem, setApiNotice } = useRestaurantDashboard()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [editor, setEditor] = useState(null)
  const [saving, setSaving] = useState(false)
  const categories = ['All categories', ...new Set(menuItems.map((item) => item.category))]
  const visibleItems = useMemo(() => menuItems.filter((item) => {
    const matchesCategory = category === 'All categories' || item.category === category
    return matchesCategory && `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())
  }), [category, menuItems, query])

  function openEditor(item) {
    setEditor(item ? { ...item } : { ...blankItem })
  }

  async function submitEditor(event) {
    event.preventDefault()
    setSaving(true)
    const payload = { ...editor, price: Number(editor.price), restaurantId: profile._id }
    const saved = await syncMenuItem(payload)
    saveMenuItem(saved ? { ...saved, id: saved._id } : payload)
    setSaving(false)
    setEditor(null)
  }

  async function deleteItem(item) {
    if (item._id && profile._id && (localStorage.getItem('restaurant-token') || localStorage.getItem('token'))) {
      try {
        await restaurantApi.deleteMenuItem(item._id)
        setApiNotice('Menu item removed from MongoDB.')
      } catch (error) {
        setApiNotice(error.message)
      }
    }
    removeMenuItem(item.id)
  }

  async function toggleAvailability(item) {
    const changed = { ...item, isAvailable: !item.isAvailable }
    const saved = await syncMenuItem(changed)
    saveMenuItem(saved ? { ...saved, id: saved._id } : changed)
  }

  return (
    <div className="dashboard-page page-enter">
      <div className="dashboard-page-heading"><div><span className="eyebrow">YOUR KITCHEN, YOUR CALL</span><h1>Menu<span className="title-dot">.</span></h1><p>{menuItems.length} dishes on the menu · changes save to this workspace</p></div><button className="dashboard-primary-button" type="button" onClick={() => openEditor()}><Plus size={16} /> Add a dish</button></div>
      <div className="menu-manager-toolbar"><label className="dashboard-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your menu" /></label><label className="menu-category-select"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((option) => <option key={option}>{option}</option>)}</select></label><span className="menu-availability-count"><span className="status-dot" /> {menuItems.filter((item) => item.isAvailable).length} available</span></div>
      <section className="dashboard-panel menu-manager"><div className="menu-manager-head"><span>DISH</span><span>CATEGORY</span><span>PRICE</span><span>AVAILABILITY</span><span>ACTIONS</span></div>{visibleItems.map((item) => <article className="menu-manager-row" key={item.id}><div className="dashboard-dish"><img src={item.image} alt="" /><span className={`food-mark ${item.isVeg ? '' : 'food-mark-nonveg'}`}><span /></span><span><strong>{item.name}</strong><small>{item.description}</small></span></div><span className="menu-row-category">{item.category}</span><strong className="menu-row-price">{formatCurrency(item.price)}</strong><button type="button" className={`availability-toggle ${item.isAvailable ? 'available' : ''}`} role="switch" aria-checked={item.isAvailable} onClick={() => toggleAvailability(item)}>{item.isAvailable ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}<span>{item.isAvailable ? 'Available' : 'Paused'}</span></button><div className="menu-row-actions"><button type="button" aria-label={`Edit ${item.name}`} onClick={() => openEditor(item)}><Pencil size={15} /></button><button type="button" aria-label={`Delete ${item.name}`} onClick={() => deleteItem(item)}><Trash2 size={15} /></button></div></article>)}{visibleItems.length === 0 && <div className="table-empty"><Search size={19} /><span>No dishes match your search.</span></div>}</section>
      {editor && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null) }}><section className="dish-editor" role="dialog" aria-modal="true" aria-labelledby="dish-editor-title"><div className="dish-editor-head"><div><span className="eyebrow">MENU EDITOR</span><h2 id="dish-editor-title">{editor.id ? 'A little edit.' : 'Add a new dish.'}</h2></div><button className="icon-action" type="button" aria-label="Close editor" onClick={() => setEditor(null)}><X size={18} /></button></div><form onSubmit={submitEditor} className="dish-editor-form"><label>Dish name<input value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} required maxLength={150} /></label><label>Description<textarea value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} rows="3" maxLength={1000} /></label><div className="editor-split"><label>Price (₹)<input type="number" min="0" step="1" value={editor.price} onChange={(event) => setEditor({ ...editor, price: event.target.value })} required /></label><label>Category<input value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} required maxLength={80} /></label></div><label>Image URL<input type="url" value={editor.image} onChange={(event) => setEditor({ ...editor, image: event.target.value })} placeholder="https://..." /></label><div className="editor-check-row"><label><input type="checkbox" checked={editor.isVeg} onChange={(event) => setEditor({ ...editor, isVeg: event.target.checked })} /> Vegetarian</label><label><input type="checkbox" checked={editor.isAvailable} onChange={(event) => setEditor({ ...editor, isAvailable: event.target.checked })} /> Available now</label></div><div className="dish-editor-actions"><button type="button" className="dashboard-outline-button" onClick={() => setEditor(null)}>Cancel</button><button type="submit" className="dashboard-primary-button" disabled={saving}>{saving ? 'Saving…' : <><Check size={15} /> Save dish</>}</button></div></form></section></div>}
    </div>
  )
}
