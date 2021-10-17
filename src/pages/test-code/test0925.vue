<script>
export default {
  methods: {
    camelize(str) {
      return str.replace(/(?:^|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ''; // or if(/\s+/.test(match)/)
        return index == 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
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