<template>
  <div>
    <h2>git配置</h2>
    查看git账号：git config --list <br/>
    设置用户名和邮箱：git config --global user.name +'用户名' / git config --global user.email + '邮箱'
    <h2>git仓库</h2>
    git关联仓库：git remote add origin 'http://'
    git查看关联仓库地址：git remote -v
    <h2>git分支操作</h2>
    git新建本地分支：git branch '分支名'<br/>
    git切换到分支：git checkout '分支名'<br/>
    git查看分支：git bracn -a<br/>
    git提交本地分支到远程仓库：git push origin '指定分支(maste)：分支名' ,默认提交的分支会在master下，当然也可以任意指定<br/>
    <h2>git版本回退</h2>
    git版本回退：git reset + ‘参数’<br/>
    1. mixed: git reset --mixed HEAD^ <br/> git reset默认参数<br/>
      暂存区内容跟着改变，工作目录不变<br/>
    2. soft: git reset --soft HEAD^ <br/>
        暂存区和工作目录的内容保持不变，对现有版本库状态改动最小<br/>
    3. hard: git reset --hard HEAD^ <br/>
      （暂存区）内容和工作目录内容都会变给定提交时的状态。也就是在给定提交后所修改的内容都会丢失(新文件会被删除，不在工作目录中的文件恢复，未清除回收站的前提)。
    <h2>git submodule</h2>
    摘取下的子模块为空时更新子模块内空：<br/>
    git submodule update --init --recursive
    <h2>css样式</h2>
    <h3>平行四边形</h3>
    <div class='wrapper'>
      <div class='public'></div>
      <div class='public move'></div>
    </div>
  </div>
</template>

<script>
  export default {
    
  }
</script>

<style lang="css" scoped>
.wraper{
  position: relative;
}
.public{
  width:0px;
  height: 0px;
  border-bottom:200px solid red;
  border-left:200px solid transparent;
  border-right: 200px solid transparent;
  border-top:200px solid transparent;
  position: absolute;
}
.move{
  transform: rotate(180deg);
  top:200px;
  left:200px;
}
</style>