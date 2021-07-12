/*!
 * elx-imgbox
 * @see https://erzh.github.io/elx-imgbox/
 */
import ElxImgbox from './ElxImgbox'
import ElxImgboxPlugin from './ElxImgboxPlugin'

Vue.component(ElxImgbox.name, ElxImgbox)

// 自动启用插件
Vue.use(ElxImgboxPlugin);

export default ElxImgbox
