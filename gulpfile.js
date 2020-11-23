const {src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')
const bs = browserSync.create()  //创建一个开发服务器

const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
// 使用gulp-load-plugins之后，下面的requrie引入的一整套就不需要写了，
// 直接使用plugins.XXX 就可以这么写了,如果遇到后面gulp-aa-bb 需要采用驼峰命名: aaBb
//  sass ====> plugins.sass
//  babel ====> plugins.babel
//  swig ====> plugins.swig
//  imagemin ====> plugins.imagemin

// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
// const swig = require('gulp-swig')
// const imagemin = require('gulp-imagemin')

// 删除生成的dist文件
const clean = ()=>{
  return del(['dist','temp'])
}

// 样式文件编译
const style =()=>{
  // 通过{base:'src'} 写出的文件路径就有了
  return src('src/assets/styles/*.scss',{ base : 'src' })   
    //下划线开头的scss文件会被认为主文件依赖的文件，就不会被转换
    //sass 输出后括号会跟在最后，可以通过{outputStyle:'expanded'完全展开
    .pipe(plugins.sass({outputStyle:'expanded'}))  
    .pipe(dest('temp'))
    .pipe(bs.reload({'stream': true}))
}

// 脚本文件编译
const script = () =>{
  return src('src/assets/scripts/*.js',{ base : 'src' })
    // 需要下载 gulp-bable  @babel/core @babel/preset-env
    // 如果忘记写 {presets:['@babel/preset-env']} 代码没有什么区别，babel只是提供一个环境
    .pipe(plugins.babel({presets:['@babel/preset-env']}))   
    .pipe(dest('temp'))
    .pipe(bs.reload({'stream': true}))
}

// 页面文件编译
const page = () =>{
  return src('src/*.html',{base:'src'})
    // 下载 gulp-swig'
    .pipe(plugins.swig())
    .pipe(dest('temp'))
    .pipe(bs.reload({'stream': true}))
}

// 图片转换
const image = ()=>{
  return src('src/assets/images/**',{base:'src'})
  // 下载 gulp-imagemin
  .pipe(plugins.imagemin())
  .pipe(dest('dist'))
}

// 文字转换
const font = ()=>{
  return src('src/assets/fonts/**',{base:'src'})
  // 下载 gulp-imagemin
  .pipe(plugins.imagemin())
  .pipe(dest('dist'))
}
// 额外的文件(public公用文件)拷贝到dist
const extra = ()=>{
  return src('public/**',{base: 'public'})
  .pipe(dest('dist'))
}
// 服务器
const serve = ()=>{
  // 监听器-->监听路径文件变化 执行后面的对应的方法
  watch('src/assets/styles/*.scss',style)
  watch('src/assets/styles/*.js',script)
  watch('src/*.html', page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  // 上面三个在开发时候不同经常构建可以如下优化：
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ],bs.reload)
  
  bs.init({  //通过init 初始化一下服务器的相关配置
    notify:  false, //右上角的小提示关闭
    port:8888, //端口
    // files: 'dist/**', // 想要哪个文件更新后 浏览器自动同步    上面加了.pipe(bs.reload({'stream': true}))这里可以注释了
    open: true, // 默认打开浏览器true  false不打开浏览器
    server:{  // server核心配置 
      baseDir: ['temp','src', 'public'],   //启服务的文件
      routes:{  //先看routes 下面的配置有没有，有就先走下面配置，没有就走baseDir
        '/node_modules': 'node_modules' //路由映射
      }
    }
  })
}

//文件引入处理
const useref = () => {
  return src('temp/*.html',{base:'temp'})
  .pipe(plugins.useref({ serachPath:['temp','.'] }))
  // html css js
  .pipe(plugins.if(/\.js$/,plugins.uglify()))   // 以js结尾执行uglify
  .pipe(plugins.if(/\.css$/,plugins.cleanCss()))  // css压缩
  .pipe(plugins.if(/\.html$/,plugins.htmlmin({
    collapsewhitespace: true,
    minifyCss: true,
    minifyJs: true
  })))  // html压缩   collapsewhitespace压缩空白字符，换行符
  // .pipe(dest('dist'))  这里html压缩时候会出问提，一边读一边写
  .pipe(dest('dist'))
}

// parallel 依次执行任务
const compile = parallel(style,script,page)

// const build =parallel(compile,extra)

//创建一个组合任务，先clean删除，再接着构建
const build = series( 
  clean, 
  parallel( 
    series(compile,useref),
    image,
    font,
    extra
  )
)

// 创建一个开发的任务
const develop = series(compile,serve)

// 上面的style是一个私有的任务，不能通过gulp 直接执行,需要导出出去
// 通过module.exports 方式导出，这个对象的所有成员都可以在外界使用
module.exports = {
  // style,
  // script,
  // page
  // compile
  build,
  // serve,
  develop,
  useref
}