import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Vant组件库
import { 
  Button, 
  NavBar, 
  Cell, 
  CellGroup, 
  Field, 
  Toast, 
  Dialog, 
  Loading,
  PullRefresh,
  List,
  Icon,
  Popup,
  ActionSheet,
  SwipeCell
} from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 注册Vant组件
app.use(Button)
app.use(NavBar)
app.use(Cell)
app.use(CellGroup)
app.use(Field)
app.use(Toast)
app.use(Dialog)
app.use(Loading)
app.use(PullRefresh)
app.use(List)
app.use(Icon)
app.use(Popup)
app.use(ActionSheet)
app.use(SwipeCell)

app.mount('#app')