"use strict";(self.webpackChunkspace_station=self.webpackChunkspace_station||[]).push([[482],{482:function(t,e,n){n.r(e),n.d(e,{solr:function(){return s}});var r=/[^\s\|\!\+\-\*\?\~\^\&\:\(\)\[\]\{\}\"\\]/,o=/[\|\!\+\-\*\?\~\^\&]/,u=/^(OR|AND|NOT|TO)$/i;function i(t){return function(e,n){for(var o=t;(t=e.peek())&&null!=t.match(r);)o+=e.next();return n.tokenize=a,u.test(o)?"operator":function(t){return parseFloat(t).toString()===t}(o)?"number":":"==e.peek()?"propertyName":"string"}}function a(t,e){var n,u,s=t.next();return'"'==s?e.tokenize=(u=s,function(t,e){for(var n,r=!1;null!=(n=t.next())&&(n!=u||r);)r=!r&&"\\"==n;return r||(e.tokenize=a),"string"}):o.test(s)?e.tokenize=(n=s,function(t,e){return"|"==n?t.eat(/\|/):"&"==n&&t.eat(/\&/),e.tokenize=a,"operator"}):r.test(s)&&(e.tokenize=i(s)),e.tokenize!=a?e.tokenize(t,e):null}var s={name:"solr",startState:function(){return{tokenize:a}},token:function(t,e){return t.eatSpace()?null:e.tokenize(t,e)}}}}]);
//# sourceMappingURL=482.9ebf7efd.chunk.js.map