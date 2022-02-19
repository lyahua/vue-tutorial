<script>
export default {
  methods: {
    camelize(str) {
      return str.replace(/(?:^|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if(/\s+/.test(match)/)
        return index == 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
    add(getX, getY, cb) {
      let x, y;
      getX(function (xVal) {
        x = xVal;
        // 两个都准备好了？
        if (y != undefined) {
          cb(x + y);
        }
      });
      getY(function (yVal) {
        y = yVal;
        // 两个都准备好了？
        if (x != undefined) {
          cb(x + y);
        }
      });
    },
  },

  mounted(){
      // this.add(fetchX,fetchY,function(sum){
      //     console.log(sum); // is very easy
      // })
  },

  render() {
    return (
      <div>
        <h1>2222</h1>
      </div>
    );
  },
};
</script>

<style lang="css" scoped>
</style>