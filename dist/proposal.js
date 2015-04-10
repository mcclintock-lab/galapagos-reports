require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],3:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],4:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var payloadSize, problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
          console.log(_this.models[0].get('payloadSizeBytes'));
          payloadSize = Math.round(((_this.models[0].get('payloadSizeBytes') || 0) / 1024) * 100) / 100;
          console.log("FeatureSet sent to GP weighed in at " + payloadSize + "kb");
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"a21iR2":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
    }
    return _.map(data.features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      console.log(this.data);
      this.tab.reportError("Could not get attribute " + attr + " from results");
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      this.render();
      return this.$('[data-attribute-type=UrlField] .value, [data-attribute-type=UploadField] .value').each(function() {
        var html, name, text, url, _i, _len, _ref3;
        text = $(this).text();
        html = [];
        _ref3 = text.split(',');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          url = _ref3[_i];
          if (url.length) {
            name = _.last(url.split('/'));
            html.push("<a target=\"_blank\" href=\"" + url + "\">" + name + "</a>");
          }
        }
        return $(this).html(html.join(', '));
      });
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    window.clearInterval(this.etaInterval);
    this.stopListening();
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var _this = this;
    if (this.maxEta) {
      _.delay(function() {
        return _this.reportResults.poll();
      }, (this.maxEta + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (_this.maxEta + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('etaSeconds')) {
        if (!maxEta || job.get('etaSeconds') > maxEta) {
          maxEta = job.get('etaSeconds');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"CNqB+b","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"+VosKh","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('a21iR2');
},{}],"api/utils":[function(require,module,exports){
module.exports=require('+VosKh');
},{}],"+VosKh":[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],"CNqB+b":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,123,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("doNotExport",c,p,1),c,p,1,0,0,"")){_.b(_.rp("attributes/attributeItem",c,p,"    "));};});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}],"api/templates":[function(require,module,exports){
module.exports=require('CNqB+b');
},{}],11:[function(require,module,exports){
var HabitatsTab, ReportTab, d3, key, partials, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

d3 = window.d3;

_partials = require('api/templates');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

HabitatsTab = (function(_super) {
  __extends(HabitatsTab, _super);

  function HabitatsTab() {
    this.sortProposalValues = __bind(this.sortProposalValues, this);
    _ref = HabitatsTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  HabitatsTab.prototype.name = 'Habitats';

  HabitatsTab.prototype.className = 'habitats';

  HabitatsTab.prototype.template = templates.habitats;

  HabitatsTab.prototype.dependencies = ['Habitat'];

  HabitatsTab.prototype.render = function() {
    var EXTRACTIVE_ZONE, INTANGIBLE_ZONE, MIXED_USE_ZONE, SUSTAINABLE_ZONE, context, err, extractive_habitats, hasExtractive, hasIntangibles, hasMixedUse, hasSustainable, intangible_habitats, isSketch, mixed_use_habitats, proposal_habitats, sketch_habitats, sustainable_habitats,
      _this = this;
    sketch_habitats = this.recordSet('Habitat', 'SketchHabitats');
    proposal_habitats = this.recordSet('Habitat', 'ProposalHabitats');
    MIXED_USE_ZONE = "mixed_use";
    SUSTAINABLE_ZONE = "sustainable_use";
    EXTRACTIVE_ZONE = "non_extractive_use";
    INTANGIBLE_ZONE = "intangible";
    try {
      isSketch = true;
      sketch_habitats = sketch_habitats.toArray();
    } catch (_error) {
      err = _error;
      isSketch = false;
      proposal_habitats = proposal_habitats.toArray();
      mixed_use_habitats = this.sortProposalValues(proposal_habitats, MIXED_USE_ZONE);
      hasMixedUse = (mixed_use_habitats != null ? mixed_use_habitats.length : void 0) > 0;
      intangible_habitats = this.sortProposalValues(proposal_habitats, INTANGIBLE_ZONE);
      hasIntangibles = (intangible_habitats != null ? intangible_habitats.length : void 0) > 0;
      extractive_habitats = this.sortProposalValues(proposal_habitats, EXTRACTIVE_ZONE);
      hasExtractive = (extractive_habitats != null ? extractive_habitats.length : void 0) > 0;
      sustainable_habitats = this.sortProposalValues(proposal_habitats, SUSTAINABLE_ZONE);
      hasSustainable = (sustainable_habitats != null ? sustainable_habitats.length : void 0) > 0;
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isSketch: isSketch,
      sketch_habitats: sketch_habitats,
      hasMixedUse: hasMixedUse,
      mixed_use_habitats: mixed_use_habitats,
      hasIntangibles: hasIntangibles,
      intangible_habitats: intangible_habitats,
      hasExtractive: hasExtractive,
      extractive_habitats: extractive_habitats,
      hasSustainable: hasSustainable,
      sustainable_habitats: sustainable_habitats
    };
    this.$el.html(this.template.render(context, partials));
    this.$('.chosen').chosen({
      disable_search_threshold: 10,
      width: '400px'
    });
    return this.$('.chosen').change(function() {
      return _.defer(_this.renderTradeoffs);
    });
  };

  HabitatsTab.prototype.sortProposalValues = function(proposal_values, type) {
    var pv, results, _i, _len;
    results = [];
    for (_i = 0, _len = proposal_values.length; _i < _len; _i++) {
      pv = proposal_values[_i];
      if (pv.ZONE_TYPE === type) {
        results.push(pv);
      }
    }
    return results;
  };

  return HabitatsTab;

})(ReportTab);

module.exports = HabitatsTab;


},{"../templates/templates.js":15,"api/templates":"CNqB+b","reportTab":"a21iR2"}],12:[function(require,module,exports){
var OverviewTab, ReportTab, d3, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

d3 = window.d3;

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['SizeStats'];

  OverviewTab.prototype.render = function() {
    var context, isCollection, names, size_km, size_stats, sketch_habitats, stat, _i, _len;
    names = {
      "mixed_use": "Mixed Use",
      "sustainable_use": "Sustainable Use",
      "non_extractive_use": 'Non Extractive Use',
      "intangible": 'Intangible'
    };
    size_stats = sketch_habitats = this.recordSet('SizeStats', 'SizeStats').toArray();
    isCollection = this.model.isCollection();
    size_km = 0;
    if (!isCollection) {
      size_km = size_stats[0].TOTAL;
    } else {
      for (_i = 0, _len = size_stats.length; _i < _len; _i++) {
        stat = size_stats[_i];
        stat.ZONE_TYPE = names[stat.ZONE_TYPE];
      }
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      size_stats: size_stats,
      size_km: size_km
    };
    return this.$el.html(this.template.render(context, templates));
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../templates/templates.js":15,"reportTab":"a21iR2"}],13:[function(require,module,exports){
var HabitatsTab, OverviewTab, TradeoffsTab;

OverviewTab = require('./overview.coffee');

TradeoffsTab = require('./tradeoffs.coffee');

HabitatsTab = require('./habitats.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, HabitatsTab, TradeoffsTab]);
  return report.stylesheets(['./proposal.css']);
});


},{"./habitats.coffee":11,"./overview.coffee":12,"./tradeoffs.coffee":14}],14:[function(require,module,exports){
var ReportTab, TradeoffsTab, d3, key, partials, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

d3 = window.d3;

_partials = require('api/templates');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

TradeoffsTab = (function(_super) {
  var calc_ttip, formatAxis, getColors, getStrokeColor;

  __extends(TradeoffsTab, _super);

  function TradeoffsTab() {
    this.scatterplot = __bind(this.scatterplot, this);
    this.renderTradeoffs = __bind(this.renderTradeoffs, this);
    this.setupScatterPlot = __bind(this.setupScatterPlot, this);
    _ref = TradeoffsTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  TradeoffsTab.prototype.name = 'Tradeoffs';

  TradeoffsTab.prototype.className = 'tradeoffs';

  TradeoffsTab.prototype.template = templates.tradeoffs;

  TradeoffsTab.prototype.dependencies = ['GalapagosTradeoffAnalysis'];

  TradeoffsTab.prototype.render = function() {
    var context, tradeoff_data, tradeoffs,
      _this = this;
    tradeoff_data = this.recordSet('GalapagosTradeoffAnalysis', 'Scores').toArray();
    tradeoffs = ['Preservation and Tourism', 'Preservation and Extractive', 'Tourism and Extractive'];
    console.log("data: ", tradeoff_data);
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      tradeoffs: tradeoffs
    };
    this.$el.html(this.template.render(context, partials));
    this.$('.chosen').chosen({
      disable_search_threshold: 10,
      width: '400px'
    });
    this.$('.chosen').change(function() {
      return _.defer(_this.renderTradeoffs);
    });
    if (window.d3) {
      this.setupScatterPlot(tradeoff_data, '.pres-v-tourism', "Preservation Value", "Tourism Value", "Preservation", "Tourism");
      this.setupScatterPlot(tradeoff_data, '.pres-v-extractive', "Preservation Value", "Extractive Value", "Preservation", "Extractive");
      return this.setupScatterPlot(tradeoff_data, '.tourism-v-extractive', "Tourism Value", "Extractive Value", "Tourism", "Extractive");
    }
  };

  TradeoffsTab.prototype.setupScatterPlot = function(tradeoff_data, chart_name, xlab, ylab, mouseXProp, mouseYProp) {
    var ch, h, halfh, halfw, margin, thechart, tooltip, totalh, totalw, verticalRule, w;
    h = 380;
    w = 380;
    margin = {
      left: 40,
      top: 5,
      right: 40,
      bottom: 40,
      inner: 5
    };
    halfh = h + margin.top + margin.bottom;
    totalh = halfh * 2;
    halfw = w + margin.left + margin.right;
    totalw = halfw * 2;
    thechart = this.scatterplot(chart_name, mouseXProp, mouseYProp).xvar(0).yvar(1).xlab(xlab).ylab(ylab).height(h).width(w).margin(margin);
    ch = d3.select(this.$(chart_name));
    ch.datum(tradeoff_data).call(thechart);
    tooltip = d3.select("body").append("div").attr("class", "chart-tooltip").attr("id", "chart-tooltip").text("data");
    verticalRule = d3.select("body").append("div").attr("class", "verticalRule").style("position", "absolute").style("z-index", "19").style("width", "1px").style("height", "250px").style("top", "10px").style("bottom", "30px").style("left", "0px").style("background", "black");
    thechart.pointsSelect().on("mouseover", function(d) {
      return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + window.app.sketches.get(d.PROPOSAL).attributes.name + "</strong><li>" + xlab + ": " + d[mouseXProp] + "</li><li> " + ylab + ": " + d[mouseYProp] + "</li></ul>");
    });
    thechart.pointsSelect().on("mousemove", function(d) {
      return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
    });
    thechart.pointsSelect().on("mouseout", function(d) {
      return tooltip.style("visibility", "hidden");
    });
    thechart.labelsSelect().on("mouseover", function(d) {
      return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + window.app.sketches.get(d.PROPOSAL).attributes.name + "</strong><li> " + xlab + ": " + d[mouseXProp] + "</li><li> " + ylab + ": " + d[mouseYProp] + "</li></ul>");
    });
    thechart.labelsSelect().on("mousemove", function(d) {
      return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
    });
    return thechart.labelsSelect().on("mouseout", function(d) {
      return tooltip.style("visibility", "hidden");
    });
  };

  TradeoffsTab.prototype.renderTradeoffs = function() {
    var name;
    name = this.$('.chosen').val();
    if (name === "Preservation and Tourism") {
      this.$('.pvt_container').show();
      this.$('.pve_container').hide();
      return this.$('.tve_container').hide();
    } else if (name === "Preservation and Extractive") {
      this.$('.pvt_container').hide();
      this.$('.pve_container').show();
      return this.$('.tve_container').hide();
    } else {
      this.$('.pvt_container').hide();
      this.$('.pve_container').hide();
      return this.$('.tve_container').show();
    }
  };

  calc_ttip = function(xloc, data, tooltip) {
    var tdiv, tleft, tw;
    tdiv = tooltip[0][0].getBoundingClientRect();
    tleft = tdiv.left;
    tw = tdiv.width;
    if (xloc + tw > tleft + tw) {
      return xloc - (tw + 10);
    }
    return xloc + 10;
  };

  TradeoffsTab.prototype.scatterplot = function(chart_name, xval, yval) {
    var axispos, chart, el, height, horizontalRule, labelsSelect, legendSelect, legendheight, margin, nxticks, nyticks, pointsSelect, pointsize, rectcolor, verticalRule, view, width, xlab, xlim, xscale, xticks, ylab, ylim, yscale, yticks;
    view = this;
    width = 380;
    height = 600;
    margin = {
      left: 40,
      top: 5,
      right: 40,
      bottom: 40,
      inner: 5
    };
    axispos = {
      xtitle: 25,
      ytitle: 30,
      xlabel: 5,
      ylabel: 5
    };
    xlim = null;
    ylim = null;
    nxticks = 5;
    xticks = null;
    nyticks = 5;
    yticks = null;
    rectcolor = "white";
    pointsize = 5;
    xlab = "X";
    ylab = "Y score";
    yscale = d3.scale.linear();
    xscale = d3.scale.linear();
    legendheight = 300;
    pointsSelect = null;
    labelsSelect = null;
    legendSelect = null;
    verticalRule = null;
    horizontalRule = null;
    if (window.d3) {
      view.$(chart_name).html('');
      el = view.$(chart_name)[0];
    }
    chart = function(selection) {
      return selection.each(function(data) {
        var currelem, g, labels, na_value, panelheight, paneloffset, panelwidth, points, svg, x, xaxis, xrange, xs, y, yaxis, yrange, ys;
        x = data.map(function(d) {
          return parseFloat(d[xval]);
        });
        y = data.map(function(d) {
          return parseFloat(d[yval]);
        });
        paneloffset = 0;
        panelwidth = width;
        panelheight = height;
        if (!(xlim != null)) {
          xlim = [d3.min(x) - 2, parseFloat(d3.max(x) + 2)];
        }
        if (!(ylim != null)) {
          ylim = [d3.min(y) - 2, parseFloat(d3.max(y) + 2)];
        }
        na_value = d3.min(x.concat(y)) - 100;
        currelem = d3.select(view.$(chart_name)[0]);
        svg = d3.select(view.$(chart_name)[0]).append("svg").data([data]);
        svg.append("g");
        svg.attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom + data.length * 35);
        g = svg.select("g");
        g.append("rect").attr("x", paneloffset + margin.left).attr("y", margin.top).attr("height", panelheight).attr("width", panelwidth).attr("fill", rectcolor).attr("stroke", "none");
        xrange = [margin.left + paneloffset + margin.inner, margin.left + paneloffset + panelwidth - margin.inner];
        yrange = [margin.top + panelheight - margin.inner, margin.top + margin.inner];
        xscale.domain(xlim).range(xrange);
        yscale.domain(ylim).range(yrange);
        xs = d3.scale.linear().domain(xlim).range(xrange);
        ys = d3.scale.linear().domain(ylim).range(yrange);
        if (!(yticks != null)) {
          yticks = ys.ticks(nyticks);
        }
        if (!(xticks != null)) {
          xticks = xs.ticks(nxticks);
        }
        xaxis = g.append("g").attr("class", "x axis");
        xaxis.selectAll("empty").data(xticks).enter().append("line").attr("x1", function(d) {
          return xscale(d);
        }).attr("x2", function(d) {
          return xscale(d);
        }).attr("y1", margin.top).attr("y2", margin.top + height).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 1).style("pointer-events", "none");
        xaxis.selectAll("empty").data(xticks).enter().append("text").attr("x", function(d) {
          return xscale(d);
        }).attr("y", margin.top + height + axispos.xlabel).text(function(d) {
          return formatAxis(xticks)(d);
        });
        xaxis.append("text").attr("class", "xaxis-title").attr("x", margin.left + width / 2).attr("y", margin.top + height + axispos.xtitle).text(xlab);
        xaxis.selectAll("empty").data(data).enter().append("circle").attr("cx", function(d, i) {
          return margin.left;
        }).attr("cy", function(d, i) {
          return margin.top + height + axispos.xtitle + ((i + 1) * 30) + 6;
        }).attr("class", function(d, i) {
          return "pt" + i;
        }).attr("r", pointsize).attr("fill", function(d, i) {
          var col;
          val = i % 17;
          col = getColors(val);
          return col;
        }).attr("stroke", function(d, i) {
          var col;
          val = Math.floor(i / 17) % 5;
          col = getStrokeColor(val);
          return col;
        }).attr("stroke-width", "1");
        xaxis.selectAll("empty").data(data).enter().append("text").attr("class", "legend-text").attr("x", function(d, i) {
          return margin.left + 20;
        }).attr("y", function(d, i) {
          return margin.top + height + axispos.xtitle + ((i + 1) * 30);
        }).text(function(d) {
          return window.app.sketches.get(d.PROPOSAL).attributes.name;
        });
        yaxis = g.append("g").attr("class", "y axis");
        yaxis.selectAll("empty").data(yticks).enter().append("line").attr("y1", function(d) {
          return yscale(d);
        }).attr("y2", function(d) {
          return yscale(d);
        }).attr("x1", margin.left).attr("x2", margin.left + width).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 1).style("pointer-events", "none");
        yaxis.selectAll("empty").data(yticks).enter().append("text").attr("y", function(d) {
          return yscale(d);
        }).attr("x", margin.left - axispos.ylabel).text(function(d) {
          return formatAxis(yticks)(d);
        });
        yaxis.append("text").attr("class", "title").attr("y", margin.top + height / 2).attr("x", margin.left - axispos.ytitle).text(ylab).attr("transform", "rotate(270," + (margin.left - axispos.ytitle) + "," + (margin.top + height / 2) + ")");
        labels = g.append("g").attr("id", "labels");
        labelsSelect = labels.selectAll("empty").data(data).enter().append("text").text(function(d) {
          return window.app.sketches.get(d.PROPOSAL).attributes.name;
        }).attr("x", function(d, i) {
          var overlap_xstart, string_end, xpos;
          xpos = xscale(x[i]);
          string_end = xpos + this.getComputedTextLength();
          overlap_xstart = xpos - (this.getComputedTextLength() + 5);
          if (overlap_xstart < 50) {
            overlap_xstart = 50;
          }
          if (string_end > width) {
            return overlap_xstart;
          }
          return xpos + 5;
        }).attr("y", function(d, i) {
          var ypos;
          ypos = yscale(y[i]);
          if (ypos < 50) {
            return ypos + 10;
          }
          return ypos - 5;
        });
        points = g.append("g").attr("id", "points");
        pointsSelect = points.selectAll("empty").data(data).enter().append("circle").attr("cx", function(d, i) {
          return xscale(x[i]);
        }).attr("cy", function(d, i) {
          return yscale(y[i]);
        }).attr("class", function(d, i) {
          return "pt" + i;
        }).attr("r", pointsize).attr("fill", function(d, i) {
          var col;
          val = i;
          col = getColors([val]);
          return col;
        }).attr("stroke", function(d, i) {
          var col;
          val = Math.floor(i / 17) % 5;
          col = getStrokeColor(val);
          return col;
        }).attr("stroke-width", "1").attr("opacity", function(d, i) {
          if (((x[i] != null) || xNA.handle) && ((y[i] != null) || yNA.handle)) {
            return 1;
          }
          return 0;
        });
        g.append("rect").attr("x", margin.left + paneloffset).attr("y", margin.top).attr("height", panelheight).attr("width", panelwidth).attr("fill", "none").attr("stroke", "black").attr("stroke-width", "none");
        return 'verticalRule = g.append("line")\n  .attr("x1", 0)\n  .attr("x2", width) \n  .attr("y1", 0)\n  .attr("y2", height)\n  .attr("stroke", "black")\n  .attr("stroke-width", 1)\n\nhorizontalRule = g.append("line")\n  .attr("x1", 0)\n  .attr("x2", width) \n  .attr("y1", 0)\n  .attr("y2", height)\n  .attr("stroke", "black")\n  .attr("stroke-width", 1)';
      });
    };
    chart.width = function(value) {
      if (!arguments.length) {
        return width;
      }
      width = value;
      return chart;
    };
    chart.height = function(value) {
      if (!arguments.length) {
        return height;
      }
      height = value;
      return chart;
    };
    chart.margin = function(value) {
      if (!arguments.length) {
        return margin;
      }
      margin = value;
      return chart;
    };
    chart.axispos = function(value) {
      if (!arguments.length) {
        return axispos;
      }
      axispos = value;
      return chart;
    };
    chart.xlim = function(value) {
      if (!arguments.length) {
        return xlim;
      }
      xlim = value;
      return chart;
    };
    chart.nxticks = function(value) {
      if (!arguments.length) {
        return nxticks;
      }
      nxticks = value;
      return chart;
    };
    chart.xticks = function(value) {
      if (!arguments.length) {
        return xticks;
      }
      xticks = value;
      return chart;
    };
    chart.ylim = function(value) {
      if (!arguments.length) {
        return ylim;
      }
      ylim = value;
      return chart;
    };
    chart.nyticks = function(value) {
      if (!arguments.length) {
        return nyticks;
      }
      nyticks = value;
      return chart;
    };
    chart.yticks = function(value) {
      if (!arguments.length) {
        return yticks;
      }
      yticks = value;
      return chart;
    };
    chart.rectcolor = function(value) {
      if (!arguments.length) {
        return rectcolor;
      }
      rectcolor = value;
      return chart;
    };
    chart.pointcolor = function(value) {
      var pointcolor;
      if (!arguments.length) {
        return pointcolor;
      }
      pointcolor = value;
      return chart;
    };
    chart.pointsize = function(value) {
      if (!arguments.length) {
        return pointsize;
      }
      pointsize = value;
      return chart;
    };
    chart.pointstroke = function(value) {
      var pointstroke;
      if (!arguments.length) {
        return pointstroke;
      }
      pointstroke = value;
      return chart;
    };
    chart.xlab = function(value) {
      if (!arguments.length) {
        return xlab;
      }
      xlab = value;
      return chart;
    };
    chart.ylab = function(value) {
      if (!arguments.length) {
        return ylab;
      }
      ylab = value;
      return chart;
    };
    chart.xvar = function(value) {
      var xvar;
      if (!arguments.length) {
        return xvar;
      }
      xvar = value;
      return chart;
    };
    chart.yvar = function(value) {
      var yvar;
      if (!arguments.length) {
        return yvar;
      }
      yvar = value;
      return chart;
    };
    chart.yscale = function() {
      return yscale;
    };
    chart.xscale = function() {
      return xscale;
    };
    chart.pointsSelect = function() {
      return pointsSelect;
    };
    chart.labelsSelect = function() {
      return labelsSelect;
    };
    chart.legendSelect = function() {
      return legendSelect;
    };
    chart.verticalRule = function() {
      return verticalRule;
    };
    chart.horizontalRule = function() {
      return horizontalRule;
    };
    return chart;
  };

  getColors = function(i) {
    var colors;
    colors = ["LightGreen", "LightPink", "LightSkyBlue", "Moccasin", "BlueViolet", "Gainsboro", "DarkGreen", "DarkTurquoise", "maroon", "navy", "LemonChiffon", "orange", "red", "silver", "teal", "white", "black"];
    return colors[i];
  };

  getStrokeColor = function(i) {
    var scolors;
    scolors = ["black", "white", "gray", "brown", "Navy"];
    return scolors[i];
  };

  formatAxis = function(d) {
    var ndig;
    d = d[1] - d[0];
    ndig = Math.floor(Math.log(d % 10) / Math.log(10));
    if (ndig > 0) {
      ndig = 0;
    }
    ndig = Math.abs(ndig);
    return d3.format("." + ndig + "f");
  };

  return TradeoffsTab;

})(ReportTab);

module.exports = TradeoffsTab;


},{"../templates/templates.js":15,"api/templates":"CNqB+b","reportTab":"a21iR2"}],15:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["habitats"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("isSketch",c,p,1),c,p,0,13,621,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Habitats</h4>");_.b("\n" + i);_.b("    <table>");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Habitat</th>");_.b("\n" + i);_.b("          <th>Percent within Sketch</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("sketch_habitats",c,p,1),c,p,0,257,361,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        <tfoot>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("            <p style=\"margin-left:10px;\">");_.b("\n" + i);_.b("              ");_.b("\n" + i);_.b("            </p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </tfoot>");_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");_.b("\n");});c.pop();}if(!_.s(_.f("isSketch",c,p,1),c,p,1,0,0,"")){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Habitats</h4>");_.b("\n" + i);if(_.s(_.f("hasIntangibles",c,p,1),c,p,0,737,1176,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("     <div class=\"list-header\">The intangible zones within this proposal include the following habitats:</div>");_.b("\n" + i);_.b("    <table>");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Habitat</th>");_.b("\n" + i);_.b("          <th>Percent within Sketch</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("intangible_habitats",c,p,1),c,p,0,1030,1134,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("    </table>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasSustainable",c,p,1),c,p,0,1220,1666,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("     <div class=\"list-header\">The sustainable use zones within this proposal include the following habitats:</div>");_.b("\n" + i);_.b("    <table>");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Habitat</th>");_.b("\n" + i);_.b("          <th>Percent within Sketch</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("sustainable_habitats",c,p,1),c,p,0,1519,1623,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("    </table>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasMixedUse",c,p,1),c,p,0,1707,2143,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("     <div class=\"list-header\">The mixed use zones within this proposal include the following habitats:</div>");_.b("\n" + i);_.b("    <table>");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Habitat</th>");_.b("\n" + i);_.b("          <th>Percent within Sketch</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("mixed_use_habitats",c,p,1),c,p,0,1998,2102,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("    </table>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("hasExtractive",c,p,1),c,p,0,2184,2627,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("     <div class=\"list-header\">The extractive use zones within this proposal include the following habitats:</div>");_.b("\n" + i);_.b("    <table>");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Habitat</th>");_.b("\n" + i);_.b("          <th>Percent within Sketch</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("extractive_habitats",c,p,1),c,p,0,2481,2585,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("    </table>");_.b("\n");});c.pop();}_.b(" </div>");_.b("\n");};return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("isCollection",c,p,1),c,p,0,17,585,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Size (in square kilometers)</h4>");_.b("\n" + i);_.b("    <table>");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Zone Type</th>");_.b("\n" + i);_.b("          <th>Total Area</th>");_.b("\n" + i);_.b("          <th>Mean Area</th>");_.b("\n" + i);_.b("          <th>Min. Area</th>");_.b("\n" + i);_.b("          <th>Max. Area</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("size_stats",c,p,1),c,p,0,353,547,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("ZONE_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOTAL",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("MEAN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("	<div class=\"reportSection\">");_.b("\n" + i);_.b("	  <h4>Size</h4>");_.b("\n" + i);_.b("	  <p class=\"large\">The selected sketch is <strong>");_.b(_.v(_.f("size_km",c,p,0)));_.b(" square kilometers</strong>.</p>");_.b("\n" + i);_.b("	</div>");_.b("\n");};return _.fl();;});
this["Templates"]["tradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);_.b("\n" + i);_.b("	<select class=\"chosen\">");_.b("\n" + i);_.b("		<label>Select a Set of Tradeoff Scores to View:</label></br>");_.b("\n" + i);_.b("		<option class=\"default-chosen-selection\" label=\"Preservation and Tourism\"></option>");_.b("\n" + i);if(_.s(_.f("tradeoffs",c,p,1),c,p,0,241,284,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("			<option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("	</select>");_.b("\n" + i);_.b("     <p class=\"small ttip-tip\">");_.b("\n" + i);_.b("	   Tip: hover over a proposal to see details");_.b("\n" + i);_.b("	</p>");_.b("\n" + i);_.b("  	<div id=\"pvt_container\" class=\"pvt_container\"><div  id=\"pres-v-tourism\" class=\"pres-v-tourism\"></div></div>");_.b("\n" + i);_.b("  	<div id=\"pve_container\" class=\"pve_container\"><div  id=\"pres-v-extractive\" class=\"pres-v-extractive\"></div></div>");_.b("\n" + i);_.b("  	<div id=\"tve_container\" class=\"tve_container\"><div  id=\"tourism-v-extractive\" class=\"tourism-v-extractive\"></div></div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvZ2FsYXBhZ29zLXJlcG9ydHMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvZ2FsYXBhZ29zLXJlcG9ydHMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvZ2FsYXBhZ29zLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2dhbGFwYWdvcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9nYWxhcGFnb3MtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRSZXN1bHRzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvZ2FsYXBhZ29zLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvZ2FsYXBhZ29zLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9nYWxhcGFnb3MtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvZ2FsYXBhZ29zLXJlcG9ydHMvc2NyaXB0cy9oYWJpdGF0cy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2dhbGFwYWdvcy1yZXBvcnRzL3NjcmlwdHMvb3ZlcnZpZXcuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9nYWxhcGFnb3MtcmVwb3J0cy9zY3JpcHRzL3Byb3Bvc2FsLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvZ2FsYXBhZ29zLXJlcG9ydHMvc2NyaXB0cy90cmFkZW9mZnMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9nYWxhcGFnb3MtcmVwb3J0cy90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxDQUNBO0FBQytCLENBRi9CLENBRThCLENBQUUsQ0FBaEMsRUFBQSxFQUFRLENBQXdCLEtBQWhDO0NBRkEsQ0FHeUIsRUFB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QUFaLENBQVAsQ0FBTztDQUNQLEVBQW1CLENBQW5CO0NBQUEsRUFBTyxDQUFQLEVBQUE7TUFGQTtDQUFBLEVBR08sQ0FBUDtDQUNHLENBQUQsQ0FBUyxDQUFBLEVBQVgsS0FBQTtDQXJlRixFQWdlYTs7Q0FoZWI7O0NBRHlCOztBQXdlM0IsQ0FoZkEsRUFnZmlCLEdBQVgsQ0FBTixLQWhmQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICBjb25zb2xlLmxvZyBAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpXG4gICAgICAgICAgcGF5bG9hZFNpemUgPSBNYXRoLnJvdW5kKCgoQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKSBvciAwKSAvIDEwMjQpICogMTAwKSAvIDEwMFxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiRmVhdHVyZVNldCBzZW50IHRvIEdQIHdlaWdoZWQgaW4gYXQgI3twYXlsb2FkU2l6ZX1rYlwiXG4gICAgICAgICMgYWxsIGNvbXBsZXRlIHRoZW5cbiAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgaWYgcHJvYmxlbSA9IF8uZmluZChAbW9kZWxzLCAocikgLT4gci5nZXQoJ2Vycm9yJyk/KVxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIFwiUHJvYmxlbSB3aXRoICN7cHJvYmxlbS5nZXQoJ3NlcnZpY2VOYW1lJyl9IGpvYlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAdHJpZ2dlciAnZmluaXNoZWQnXG4gICAgICBlcnJvcjogKGUsIHJlcywgYSwgYikgPT5cbiAgICAgICAgdW5sZXNzIHJlcy5zdGF0dXMgaXMgMFxuICAgICAgICAgIGlmIHJlcy5yZXNwb25zZVRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHJlcy5yZXNwb25zZVRleHQpXG4gICAgICAgICAgICBjYXRjaFxuICAgICAgICAgICAgICAjIGRvIG5vdGhpbmdcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGpzb24/LmVycm9yPy5tZXNzYWdlIG9yXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT5cbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3XG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEAkKCdbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcmxGaWVsZF0gLnZhbHVlLCBbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcGxvYWRGaWVsZF0gLnZhbHVlJykuZWFjaCAoKSAtPlxuICAgICAgICB0ZXh0ID0gJChAKS50ZXh0KClcbiAgICAgICAgaHRtbCA9IFtdXG4gICAgICAgIGZvciB1cmwgaW4gdGV4dC5zcGxpdCgnLCcpXG4gICAgICAgICAgaWYgdXJsLmxlbmd0aFxuICAgICAgICAgICAgbmFtZSA9IF8ubGFzdCh1cmwuc3BsaXQoJy8nKSlcbiAgICAgICAgICAgIGh0bWwucHVzaCBcIlwiXCI8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiI3t1cmx9XCI+I3tuYW1lfTwvYT5cIlwiXCJcbiAgICAgICAgJChAKS5odG1sIGh0bWwuam9pbignLCAnKVxuXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcblxuICByZXBvcnRSZXF1ZXN0ZWQ6ICgpID0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlcy5yZXBvcnRMb2FkaW5nLnJlbmRlcih7fSlcblxuICByZXBvcnRFcnJvcjogKG1zZywgY2FuY2VsbGVkUmVxdWVzdCkgPT5cbiAgICB1bmxlc3MgY2FuY2VsbGVkUmVxdWVzdFxuICAgICAgaWYgbXNnIGlzICdKT0JfRVJST1InXG4gICAgICAgIEBzaG93RXJyb3IgJ0Vycm9yIHdpdGggc3BlY2lmaWMgam9iJ1xuICAgICAgZWxzZVxuICAgICAgICBAc2hvd0Vycm9yIG1zZ1xuXG4gIHNob3dFcnJvcjogKG1zZykgPT5cbiAgICBAJCgnLnByb2dyZXNzJykucmVtb3ZlKClcbiAgICBAJCgncC5lcnJvcicpLnJlbW92ZSgpXG4gICAgQCQoJ2g0JykudGV4dChcIkFuIEVycm9yIE9jY3VycmVkXCIpLmFmdGVyIFwiXCJcIlxuICAgICAgPHAgY2xhc3M9XCJlcnJvclwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+I3ttc2d9PC9wPlxuICAgIFwiXCJcIlxuXG4gIHJlcG9ydEpvYnM6ICgpID0+XG4gICAgdW5sZXNzIEBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICBAJCgnaDQnKS50ZXh0IFwiQW5hbHl6aW5nIERlc2lnbnNcIlxuXG4gIHN0YXJ0RXRhQ291bnRkb3duOiAoKSA9PlxuICAgIGlmIEBtYXhFdGFcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChAbWF4RXRhICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7QG1heEV0YSArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YVNlY29uZHMnKSA+IG1heEV0YVxuICAgICAgICAgIG1heEV0YSA9IGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPlxuICAgICAgcGFyYW0ucGFyYW1OYW1lIGlzIHBhcmFtTmFtZVxuICAgIHVubGVzcyBwYXJhbVxuICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtLCBALCBza2V0Y2hDbGFzc0lkKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KClcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYlxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDEyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoIV8ucyhfLmYoXCJkb05vdEV4cG9ydFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59IiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmQzID0gd2luZG93LmQzXG5fcGFydGlhbHMgPSByZXF1aXJlICdhcGkvdGVtcGxhdGVzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgSGFiaXRhdHNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0hhYml0YXRzJ1xuICBjbGFzc05hbWU6ICdoYWJpdGF0cydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5oYWJpdGF0c1xuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnSGFiaXRhdCdcbiAgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBza2V0Y2hfaGFiaXRhdHMgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ1NrZXRjaEhhYml0YXRzJylcbiAgICBwcm9wb3NhbF9oYWJpdGF0cyA9IEByZWNvcmRTZXQoJ0hhYml0YXQnLCAnUHJvcG9zYWxIYWJpdGF0cycpXG4gICAgTUlYRURfVVNFX1pPTkUgPSBcIm1peGVkX3VzZVwiXG4gICAgU1VTVEFJTkFCTEVfWk9ORSA9IFwic3VzdGFpbmFibGVfdXNlXCJcbiAgICBFWFRSQUNUSVZFX1pPTkUgPSBcIm5vbl9leHRyYWN0aXZlX3VzZVwiXG4gICAgSU5UQU5HSUJMRV9aT05FID0gXCJpbnRhbmdpYmxlXCJcblxuICAgIHRyeVxuICAgICAgaXNTa2V0Y2ggPSB0cnVlXG4gICAgICBza2V0Y2hfaGFiaXRhdHMgPSBza2V0Y2hfaGFiaXRhdHMudG9BcnJheSgpXG4gICAgY2F0Y2ggZXJyXG4gICAgICBcbiAgICAgIGlzU2tldGNoID0gZmFsc2VcbiAgICAgIHByb3Bvc2FsX2hhYml0YXRzID0gcHJvcG9zYWxfaGFiaXRhdHMudG9BcnJheSgpXG4gICAgICBtaXhlZF91c2VfaGFiaXRhdHMgPSBAc29ydFByb3Bvc2FsVmFsdWVzKHByb3Bvc2FsX2hhYml0YXRzLCBNSVhFRF9VU0VfWk9ORSlcbiAgICAgIGhhc01peGVkVXNlID0gbWl4ZWRfdXNlX2hhYml0YXRzPy5sZW5ndGggPiAwXG5cbiAgICAgIGludGFuZ2libGVfaGFiaXRhdHMgPSBAc29ydFByb3Bvc2FsVmFsdWVzKHByb3Bvc2FsX2hhYml0YXRzLCBJTlRBTkdJQkxFX1pPTkUpXG4gICAgICBoYXNJbnRhbmdpYmxlcyA9IGludGFuZ2libGVfaGFiaXRhdHM/Lmxlbmd0aCA+IDBcblxuICAgICAgZXh0cmFjdGl2ZV9oYWJpdGF0cyA9IEBzb3J0UHJvcG9zYWxWYWx1ZXMocHJvcG9zYWxfaGFiaXRhdHMsIEVYVFJBQ1RJVkVfWk9ORSlcbiAgICAgIGhhc0V4dHJhY3RpdmUgPSBleHRyYWN0aXZlX2hhYml0YXRzPy5sZW5ndGggPiAwXG5cbiAgICAgIHN1c3RhaW5hYmxlX2hhYml0YXRzID0gQHNvcnRQcm9wb3NhbFZhbHVlcyhwcm9wb3NhbF9oYWJpdGF0cywgU1VTVEFJTkFCTEVfWk9ORSlcbiAgICAgIGhhc1N1c3RhaW5hYmxlID0gc3VzdGFpbmFibGVfaGFiaXRhdHM/Lmxlbmd0aCA+IDBcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNTa2V0Y2g6IGlzU2tldGNoXG4gICAgICBza2V0Y2hfaGFiaXRhdHM6IHNrZXRjaF9oYWJpdGF0c1xuXG4gICAgICBoYXNNaXhlZFVzZTogaGFzTWl4ZWRVc2VcbiAgICAgIG1peGVkX3VzZV9oYWJpdGF0czogbWl4ZWRfdXNlX2hhYml0YXRzXG4gICAgICBoYXNJbnRhbmdpYmxlczogaGFzSW50YW5naWJsZXNcbiAgICAgIGludGFuZ2libGVfaGFiaXRhdHM6IGludGFuZ2libGVfaGFiaXRhdHNcbiAgICAgIGhhc0V4dHJhY3RpdmU6IGhhc0V4dHJhY3RpdmVcbiAgICAgIGV4dHJhY3RpdmVfaGFiaXRhdHM6IGV4dHJhY3RpdmVfaGFiaXRhdHNcbiAgICAgIGhhc1N1c3RhaW5hYmxlOiBoYXNTdXN0YWluYWJsZVxuICAgICAgc3VzdGFpbmFibGVfaGFiaXRhdHM6IHN1c3RhaW5hYmxlX2hhYml0YXRzXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEAkKCcuY2hvc2VuJykuY2hvc2VuKHtkaXNhYmxlX3NlYXJjaF90aHJlc2hvbGQ6IDEwLCB3aWR0aDonNDAwcHgnfSlcbiAgICBAJCgnLmNob3NlbicpLmNoYW5nZSAoKSA9PlxuICAgICAgXy5kZWZlciBAcmVuZGVyVHJhZGVvZmZzXG5cbiAgc29ydFByb3Bvc2FsVmFsdWVzOiAocHJvcG9zYWxfdmFsdWVzLCB0eXBlKSA9PlxuICAgIHJlc3VsdHMgPSBbXVxuICAgIGZvciBwdiBpbiBwcm9wb3NhbF92YWx1ZXNcbiAgICAgIGlmIHB2LlpPTkVfVFlQRSA9PSB0eXBlXG4gICAgICAgIHJlc3VsdHMucHVzaChwdilcbiAgICByZXR1cm4gcmVzdWx0c1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhhYml0YXRzVGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmQzID0gd2luZG93LmQzXG5cbmNsYXNzIE92ZXJ2aWV3VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdPdmVydmlldydcbiAgY2xhc3NOYW1lOiAnb3ZlcnZpZXcnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMub3ZlcnZpZXdcbiAgZGVwZW5kZW5jaWVzOlsgXG4gICAgJ1NpemVTdGF0cydcbiAgXVxuICByZW5kZXI6ICgpIC0+XG4gICAgbmFtZXMgPSB7XG4gICAgICAgICAgICAgIFwibWl4ZWRfdXNlXCI6IFwiTWl4ZWQgVXNlXCIsIFxuICAgICAgICAgICAgICBcInN1c3RhaW5hYmxlX3VzZVwiOiBcIlN1c3RhaW5hYmxlIFVzZVwiLCBcbiAgICAgICAgICAgICAgXCJub25fZXh0cmFjdGl2ZV91c2VcIjogJ05vbiBFeHRyYWN0aXZlIFVzZScsIFxuICAgICAgICAgICAgICBcImludGFuZ2libGVcIjogJ0ludGFuZ2libGUnXG4gICAgICAgICAgICB9XG5cbiAgICAjIGNyZWF0ZSByYW5kb20gZGF0YSBmb3IgdmlzdWFsaXphdGlvblxuICAgIHNpemVfc3RhdHMgPSBza2V0Y2hfaGFiaXRhdHMgPSBAcmVjb3JkU2V0KCdTaXplU3RhdHMnLCAnU2l6ZVN0YXRzJykudG9BcnJheSgpXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgc2l6ZV9rbSA9IDBcbiAgICBpZiAhaXNDb2xsZWN0aW9uXG4gICAgICBzaXplX2ttID0gc2l6ZV9zdGF0c1swXS5UT1RBTFxuICAgIGVsc2VcbiAgICAgIGZvciBzdGF0IGluIHNpemVfc3RhdHNcbiAgICAgICAgc3RhdC5aT05FX1RZUEUgPSBuYW1lc1tzdGF0LlpPTkVfVFlQRV1cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgc2l6ZV9zdGF0czogc2l6ZV9zdGF0c1xuICAgICAgc2l6ZV9rbTogc2l6ZV9rbVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcblxuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBPdmVydmlld1RhYiIsIk92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9vdmVydmlldy5jb2ZmZWUnXG5UcmFkZW9mZnNUYWIgPSByZXF1aXJlICcuL3RyYWRlb2Zmcy5jb2ZmZWUnXG5IYWJpdGF0c1RhYiA9IHJlcXVpcmUgJy4vaGFiaXRhdHMuY29mZmVlJ1xud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbT3ZlcnZpZXdUYWIsIEhhYml0YXRzVGFiLCBUcmFkZW9mZnNUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcHJvcG9zYWwuY3NzJ11cblxuIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmQzID0gd2luZG93LmQzXG5fcGFydGlhbHMgPSByZXF1aXJlICdhcGkvdGVtcGxhdGVzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgVHJhZGVvZmZzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdUcmFkZW9mZnMnXG4gIGNsYXNzTmFtZTogJ3RyYWRlb2ZmcydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy50cmFkZW9mZnNcbiAgZGVwZW5kZW5jaWVzOlsgXG4gICAgJ0dhbGFwYWdvc1RyYWRlb2ZmQW5hbHlzaXMnXG4gIF1cblxuICByZW5kZXI6ICgpIC0+XG4gICAgdHJhZGVvZmZfZGF0YSA9IEByZWNvcmRTZXQoJ0dhbGFwYWdvc1RyYWRlb2ZmQW5hbHlzaXMnLCAnU2NvcmVzJykudG9BcnJheSgpXG4gICAgdHJhZGVvZmZzID0gWydQcmVzZXJ2YXRpb24gYW5kIFRvdXJpc20nLCAnUHJlc2VydmF0aW9uIGFuZCBFeHRyYWN0aXZlJywgJ1RvdXJpc20gYW5kIEV4dHJhY3RpdmUnXVxuICAgIGNvbnNvbGUubG9nKFwiZGF0YTogXCIsIHRyYWRlb2ZmX2RhdGEpXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICB0cmFkZW9mZnM6IHRyYWRlb2Zmc1xuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEAkKCcuY2hvc2VuJykuY2hvc2VuKHtkaXNhYmxlX3NlYXJjaF90aHJlc2hvbGQ6IDEwLCB3aWR0aDonNDAwcHgnfSlcbiAgICBAJCgnLmNob3NlbicpLmNoYW5nZSAoKSA9PlxuICAgICAgXy5kZWZlciBAcmVuZGVyVHJhZGVvZmZzXG5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIEBzZXR1cFNjYXR0ZXJQbG90KHRyYWRlb2ZmX2RhdGEsICcucHJlcy12LXRvdXJpc20nLCBcIlByZXNlcnZhdGlvbiBWYWx1ZVwiLCBcIlRvdXJpc20gVmFsdWVcIiwgXCJQcmVzZXJ2YXRpb25cIiwgXCJUb3VyaXNtXCIpXG4gICAgICBAc2V0dXBTY2F0dGVyUGxvdCB0cmFkZW9mZl9kYXRhLCAnLnByZXMtdi1leHRyYWN0aXZlJywgXCJQcmVzZXJ2YXRpb24gVmFsdWVcIiwgXCJFeHRyYWN0aXZlIFZhbHVlXCIsIFwiUHJlc2VydmF0aW9uXCIsIFwiRXh0cmFjdGl2ZVwiXG4gICAgICBAc2V0dXBTY2F0dGVyUGxvdCB0cmFkZW9mZl9kYXRhLCAnLnRvdXJpc20tdi1leHRyYWN0aXZlJywgXCJUb3VyaXNtIFZhbHVlXCIsIFwiRXh0cmFjdGl2ZSBWYWx1ZVwiLCBcIlRvdXJpc21cIiwgXCJFeHRyYWN0aXZlXCJcblxuXG4gIHNldHVwU2NhdHRlclBsb3Q6ICh0cmFkZW9mZl9kYXRhLCBjaGFydF9uYW1lLCB4bGFiLCB5bGFiLCBtb3VzZVhQcm9wLCBtb3VzZVlQcm9wKSA9PlxuICAgICAgaCA9IDM4MFxuICAgICAgdyA9IDM4MFxuICAgICAgbWFyZ2luID0ge2xlZnQ6NDAsIHRvcDo1LCByaWdodDo0MCwgYm90dG9tOiA0MCwgaW5uZXI6NX1cbiAgICAgIGhhbGZoID0gKGgrbWFyZ2luLnRvcCttYXJnaW4uYm90dG9tKVxuICAgICAgdG90YWxoID0gaGFsZmgqMlxuICAgICAgaGFsZncgPSAodyttYXJnaW4ubGVmdCttYXJnaW4ucmlnaHQpXG4gICAgICB0b3RhbHcgPSBoYWxmdyoyXG5cbiAgICAgICNtYWtlIHN1cmUgaXRzIEBzY2F0dGVycGxvdCB0byBwYXNzIGluIHRoZSByaWdodCBjb250ZXh0ICh0YWIpIGZvciBkM1xuICAgICAgdGhlY2hhcnQgPSBAc2NhdHRlcnBsb3QoY2hhcnRfbmFtZSwgbW91c2VYUHJvcCwgbW91c2VZUHJvcCkueHZhcigwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueXZhcigxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueGxhYih4bGFiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueWxhYih5bGFiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaGVpZ2h0KGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aWR0aCh3KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFyZ2luKG1hcmdpbilcblxuICAgICAgY2ggPSBkMy5zZWxlY3QoQCQoY2hhcnRfbmFtZSkpXG4gICAgICBjaC5kYXR1bSh0cmFkZW9mZl9kYXRhKVxuICAgICAgICAuY2FsbCh0aGVjaGFydClcbiAgICAgIFxuICAgICAgdG9vbHRpcCA9IGQzLnNlbGVjdChcImJvZHlcIilcbiAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY2hhcnQtdG9vbHRpcFwiKVxuICAgICAgICAuYXR0cihcImlkXCIsIFwiY2hhcnQtdG9vbHRpcFwiKVxuICAgICAgICAudGV4dChcImRhdGFcIilcblxuICAgICBcbiAgICAgIHZlcnRpY2FsUnVsZSA9IGQzLnNlbGVjdChcImJvZHlcIilcbiAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInZlcnRpY2FsUnVsZVwiKVxuICAgICAgICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwiYWJzb2x1dGVcIilcbiAgICAgICAgICAuc3R5bGUoXCJ6LWluZGV4XCIsIFwiMTlcIilcbiAgICAgICAgICAuc3R5bGUoXCJ3aWR0aFwiLCBcIjFweFwiKVxuICAgICAgICAgIC5zdHlsZShcImhlaWdodFwiLCBcIjI1MHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwidG9wXCIsIFwiMTBweFwiKVxuICAgICAgICAgIC5zdHlsZShcImJvdHRvbVwiLCBcIjMwcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIFwiMHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiYmFja2dyb3VuZFwiLCBcImJsYWNrXCIpO1xuXG4gICAgICB0aGVjaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW92ZXJcIiwgKGQpIC0+IFxuXG4gICAgICAgICAgcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKS5odG1sKFwiPHVsPjxzdHJvbmc+UHJvcG9zYWw6IFwiK3dpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZStcIjwvc3Ryb25nPjxsaT5cIit4bGFiK1wiOiBcIitkW21vdXNlWFByb3BdK1wiPC9saT48bGk+IFwiK3lsYWIrXCI6IFwiK2RbbW91c2VZUHJvcF0rXCI8L2xpPjwvdWw+XCIpXG4gICAgICAgIFxuICAgICAgdGhlY2hhcnQucG9pbnRzU2VsZWN0KClcblxuICAgICAgICAub24gXCJtb3VzZW1vdmVcIiwgKGQpIC0+IFxuICAgICAgICAgIHJldHVybiB0b29sdGlwLnN0eWxlKFwidG9wXCIsIChldmVudC5wYWdlWS0xMCkrXCJweFwiKS5zdHlsZShcImxlZnRcIiwoY2FsY190dGlwKGV2ZW50LnBhZ2VYLCBkLCB0b29sdGlwKSkrXCJweFwiKVxuICAgICAgXG4gICAgICB0aGVjaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gXG4gICAgICAgICAgcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG4gICAgICB0aGVjaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW92ZXJcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIikuaHRtbChcIjx1bD48c3Ryb25nPlByb3Bvc2FsOiBcIit3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUrXCI8L3N0cm9uZz48bGk+IFwiK3hsYWIrXCI6IFwiK2RbbW91c2VYUHJvcF0rXCI8L2xpPjxsaT4gXCIreWxhYitcIjogXCIrZFttb3VzZVlQcm9wXStcIjwvbGk+PC91bD5cIilcbiAgICAgIHRoZWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlbW92ZVwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ0b3BcIiwgKGV2ZW50LnBhZ2VZLTEwKStcInB4XCIpLnN0eWxlKFwibGVmdFwiLChjYWxjX3R0aXAoZXZlbnQucGFnZVgsIGQsIHRvb2x0aXApKStcInB4XCIpXG4gICAgICB0aGVjaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG5cblxuICByZW5kZXJUcmFkZW9mZnM6ICgpID0+XG4gICAgbmFtZSA9IEAkKCcuY2hvc2VuJykudmFsKClcbiAgICBpZiBuYW1lID09IFwiUHJlc2VydmF0aW9uIGFuZCBUb3VyaXNtXCJcbiAgICAgIEAkKCcucHZ0X2NvbnRhaW5lcicpLnNob3coKVxuICAgICAgQCQoJy5wdmVfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLnR2ZV9jb250YWluZXInKS5oaWRlKClcbiAgICBlbHNlIGlmIG5hbWUgPT0gXCJQcmVzZXJ2YXRpb24gYW5kIEV4dHJhY3RpdmVcIlxuICAgICAgQCQoJy5wdnRfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLnB2ZV9jb250YWluZXInKS5zaG93KClcbiAgICAgIEAkKCcudHZlX2NvbnRhaW5lcicpLmhpZGUoKVxuICAgIGVsc2VcbiAgICAgIEAkKCcucHZ0X2NvbnRhaW5lcicpLmhpZGUoKVxuICAgICAgQCQoJy5wdmVfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLnR2ZV9jb250YWluZXInKS5zaG93KClcblxuICBjYWxjX3R0aXAgPSAoeGxvYywgZGF0YSwgdG9vbHRpcCkgLT5cbiAgICB0ZGl2ID0gdG9vbHRpcFswXVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIHRsZWZ0ID0gdGRpdi5sZWZ0XG4gICAgdHcgPSB0ZGl2LndpZHRoXG4gICAgcmV0dXJuIHhsb2MtKHR3KzEwKSBpZiAoeGxvYyt0dyA+IHRsZWZ0K3R3KVxuICAgIHJldHVybiB4bG9jKzEwXG5cblxuXG5cbiAgc2NhdHRlcnBsb3Q6IChjaGFydF9uYW1lLCB4dmFsLCB5dmFsKSA9PlxuICAgIHZpZXcgPSBAXG4gICAgd2lkdGggPSAzODBcbiAgICBoZWlnaHQgPSA2MDBcbiAgICBtYXJnaW4gPSB7bGVmdDo0MCwgdG9wOjUsIHJpZ2h0OjQwLCBib3R0b206IDQwLCBpbm5lcjo1fVxuICAgIGF4aXNwb3MgPSB7eHRpdGxlOjI1LCB5dGl0bGU6MzAsIHhsYWJlbDo1LCB5bGFiZWw6NX1cbiAgICB4bGltID0gbnVsbFxuICAgIHlsaW0gPSBudWxsXG4gICAgbnh0aWNrcyA9IDVcbiAgICB4dGlja3MgPSBudWxsXG4gICAgbnl0aWNrcyA9IDVcbiAgICB5dGlja3MgPSBudWxsXG4gICAgI3JlY3Rjb2xvciA9IGQzLnJnYigyMzAsIDIzMCwgMjMwKVxuICAgIHJlY3Rjb2xvciA9IFwid2hpdGVcIlxuICAgIHBvaW50c2l6ZSA9IDUgIyBkZWZhdWx0ID0gbm8gdmlzaWJsZSBwb2ludHMgYXQgbWFya2Vyc1xuICAgIHhsYWIgPSBcIlhcIlxuICAgIHlsYWIgPSBcIlkgc2NvcmVcIlxuICAgIHlzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgeHNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICBsZWdlbmRoZWlnaHQgPSAzMDBcbiAgICBwb2ludHNTZWxlY3QgPSBudWxsXG4gICAgbGFiZWxzU2VsZWN0ID0gbnVsbFxuICAgIGxlZ2VuZFNlbGVjdCA9IG51bGxcbiAgICB2ZXJ0aWNhbFJ1bGUgPSBudWxsXG4gICAgaG9yaXpvbnRhbFJ1bGUgPSBudWxsXG5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgICNjbGVhciBvdXQgdGhlIG9sZCB2YWx1ZXNcbiAgICAgIHZpZXcuJChjaGFydF9uYW1lKS5odG1sKCcnKVxuICAgICAgZWwgPSB2aWV3LiQoY2hhcnRfbmFtZSlbMF1cblxuICAgICMjIHRoZSBtYWluIGZ1bmN0aW9uXG4gICAgY2hhcnQgPSAoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLmVhY2ggKGRhdGEpIC0+XG4gICAgICAgIHggPSBkYXRhLm1hcCAoZCkgLT4gcGFyc2VGbG9hdChkW3h2YWxdKVxuICAgICAgICB5ID0gZGF0YS5tYXAgKGQpIC0+IHBhcnNlRmxvYXQoZFt5dmFsXSlcblxuICAgICAgICBwYW5lbG9mZnNldCA9IDBcbiAgICAgICAgcGFuZWx3aWR0aCA9IHdpZHRoXG4gICAgICAgIHBhbmVsaGVpZ2h0ID0gaGVpZ2h0XG5cbiAgICAgICAgeGxpbSA9IFtkMy5taW4oeCktMiwgcGFyc2VGbG9hdChkMy5tYXgoeCkrMildIGlmICEoeGxpbT8pXG5cbiAgICAgICAgeWxpbSA9IFtkMy5taW4oeSktMiwgcGFyc2VGbG9hdChkMy5tYXgoeSkrMildIGlmICEoeWxpbT8pXG5cbiAgICAgICAgIyBJJ2xsIHJlcGxhY2UgbWlzc2luZyB2YWx1ZXMgc29tZXRoaW5nIHNtYWxsZXIgdGhhbiB3aGF0J3Mgb2JzZXJ2ZWRcbiAgICAgICAgbmFfdmFsdWUgPSBkMy5taW4oeC5jb25jYXQgeSkgLSAxMDBcbiAgICAgICAgY3VycmVsZW0gPSBkMy5zZWxlY3Qodmlldy4kKGNoYXJ0X25hbWUpWzBdKVxuICAgICAgICBzdmcgPSBkMy5zZWxlY3Qodmlldy4kKGNoYXJ0X25hbWUpWzBdKS5hcHBlbmQoXCJzdmdcIikuZGF0YShbZGF0YV0pXG4gICAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG5cbiAgICAgICAgIyBVcGRhdGUgdGhlIG91dGVyIGRpbWVuc2lvbnMuXG4gICAgICAgIHN2Zy5hdHRyKFwid2lkdGhcIiwgd2lkdGgrbWFyZ2luLmxlZnQrbWFyZ2luLnJpZ2h0KVxuICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQrbWFyZ2luLnRvcCttYXJnaW4uYm90dG9tK2RhdGEubGVuZ3RoKjM1KVxuXG4gICAgICAgIGcgPSBzdmcuc2VsZWN0KFwiZ1wiKVxuXG4gICAgICAgICMgYm94XG4gICAgICAgIGcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgLmF0dHIoXCJ4XCIsIHBhbmVsb2Zmc2V0K21hcmdpbi5sZWZ0KVxuICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAuYXR0cihcImhlaWdodFwiLCBwYW5lbGhlaWdodClcbiAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcGFuZWx3aWR0aClcbiAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCByZWN0Y29sb3IpXG4gICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIm5vbmVcIilcblxuXG4gICAgICAgICMgc2ltcGxlIHNjYWxlcyAoaWdub3JlIE5BIGJ1c2luZXNzKVxuICAgICAgICB4cmFuZ2UgPSBbbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQrbWFyZ2luLmlubmVyLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldCtwYW5lbHdpZHRoLW1hcmdpbi5pbm5lcl1cbiAgICAgICAgeXJhbmdlID0gW21hcmdpbi50b3ArcGFuZWxoZWlnaHQtbWFyZ2luLmlubmVyLCBtYXJnaW4udG9wK21hcmdpbi5pbm5lcl1cbiAgICAgICAgeHNjYWxlLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzY2FsZS5kb21haW4oeWxpbSkucmFuZ2UoeXJhbmdlKVxuICAgICAgICB4cyA9IGQzLnNjYWxlLmxpbmVhcigpLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzID0gZDMuc2NhbGUubGluZWFyKCkuZG9tYWluKHlsaW0pLnJhbmdlKHlyYW5nZSlcblxuXG4gICAgICAgICMgaWYgeXRpY2tzIG5vdCBwcm92aWRlZCwgdXNlIG55dGlja3MgdG8gY2hvb3NlIHByZXR0eSBvbmVzXG4gICAgICAgIHl0aWNrcyA9IHlzLnRpY2tzKG55dGlja3MpIGlmICEoeXRpY2tzPylcbiAgICAgICAgeHRpY2tzID0geHMudGlja3Mobnh0aWNrcykgaWYgISh4dGlja3M/KVxuXG5cbiAgICAgICAgIyB4LWF4aXNcbiAgICAgICAgeGF4aXMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeHRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcIngxXCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4geHNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgbWFyZ2luLnRvcClcbiAgICAgICAgICAgICAuYXR0cihcInkyXCIsIG1hcmdpbi50b3AraGVpZ2h0KVxuICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIndoaXRlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMSlcbiAgICAgICAgICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh4dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4geHNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnhsYWJlbClcbiAgICAgICAgICAgICAudGV4dCgoZCkgLT4gZm9ybWF0QXhpcyh4dGlja3MpKGQpKVxuICAgICAgICB4YXhpcy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInhheGlzLXRpdGxlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0K3dpZHRoLzIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKVxuICAgICAgICAgICAgIC50ZXh0KHhsYWIpXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgICAuYXR0cihcImN4XCIsIChkLGkpIC0+IG1hcmdpbi5sZWZ0KVxuICAgICAgICAgICAgIC5hdHRyKFwiY3lcIiwgKGQsaSkgLT4gbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUrKChpKzEpKjMwKSs2KVxuICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQsaSkgLT4gXCJwdCN7aX1cIilcbiAgICAgICAgICAgICAuYXR0cihcInJcIiwgcG9pbnRzaXplKVxuICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBpICUgMTdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0Q29sb3JzKHZhbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgKGQsIGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IE1hdGguZmxvb3IoaS8xNykgJSA1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldFN0cm9rZUNvbG9yKHZhbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCIxXCIpXG5cbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGVnZW5kLXRleHRcIilcblxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBtYXJnaW4ubGVmdCsyMClcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSsoKGkrMSkqMzApKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiByZXR1cm4gd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lKVxuICAgICAgICAjIHktYXhpc1xuICAgICAgICB5YXhpcyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAgICAgeWF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh5dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MVwiLCBtYXJnaW4ubGVmdClcbiAgICAgICAgICAgICAuYXR0cihcIngyXCIsIG1hcmdpbi5sZWZ0K3dpZHRoKVxuICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIndoaXRlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMSlcbiAgICAgICAgICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIilcbiAgICAgICAgeWF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh5dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdC1heGlzcG9zLnlsYWJlbClcbiAgICAgICAgICAgICAudGV4dCgoZCkgLT4gZm9ybWF0QXhpcyh5dGlja3MpKGQpKVxuICAgICAgICB5YXhpcy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpdGxlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0LzIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueXRpdGxlKVxuICAgICAgICAgICAgIC50ZXh0KHlsYWIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoMjcwLCN7bWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGV9LCN7bWFyZ2luLnRvcCtoZWlnaHQvMn0pXCIpXG5cblxuICAgICAgICBsYWJlbHMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImlkXCIsIFwibGFiZWxzXCIpXG4gICAgICAgIGxhYmVsc1NlbGVjdCA9XG4gICAgICAgICAgbGFiZWxzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgICAgLnRleHQoKGQpLT4gcmV0dXJuIHdpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgIHhwb3MgPSB4c2NhbGUoeFtpXSlcbiAgICAgICAgICAgICAgICAgIHN0cmluZ19lbmQgPSB4cG9zK3RoaXMuZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKClcbiAgICAgICAgICAgICAgICAgIG92ZXJsYXBfeHN0YXJ0ID0geHBvcy0odGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSs1KVxuICAgICAgICAgICAgICAgICAgaWYgb3ZlcmxhcF94c3RhcnQgPCA1MFxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwX3hzdGFydCA9IDUwXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3ZlcmxhcF94c3RhcnQgaWYgc3RyaW5nX2VuZCA+IHdpZHRoXG4gICAgICAgICAgICAgICAgICByZXR1cm4geHBvcys1XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICB5cG9zID0geXNjYWxlKHlbaV0pXG4gICAgICAgICAgICAgICAgICByZXR1cm4geXBvcysxMCBpZiAoeXBvcyA8IDUwKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHlwb3MtNVxuICAgICAgICAgICAgICAgICAgKVxuXG5cbiAgICAgICAgcG9pbnRzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJpZFwiLCBcInBvaW50c1wiKVxuICAgICAgICBwb2ludHNTZWxlY3QgPVxuICAgICAgICAgIHBvaW50cy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCAoZCxpKSAtPiB4c2NhbGUoeFtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiB5c2NhbGUoeVtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0Q29sb3JzKFt2YWxdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcIm9wYWNpdHlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxIGlmICh4W2ldPyBvciB4TkEuaGFuZGxlKSBhbmQgKHlbaV0/IG9yIHlOQS5oYW5kbGUpXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gMClcblxuICAgICAgICAjIGJveFxuICAgICAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldClcbiAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgcGFuZWxoZWlnaHQpXG4gICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHBhbmVsd2lkdGgpXG4gICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgJycnXG4gICAgICAgIHZlcnRpY2FsUnVsZSA9IGcuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgIC5hdHRyKFwieDFcIiwgMClcbiAgICAgICAgICAuYXR0cihcIngyXCIsIHdpZHRoKSBcbiAgICAgICAgICAuYXR0cihcInkxXCIsIDApXG4gICAgICAgICAgLmF0dHIoXCJ5MlwiLCBoZWlnaHQpXG4gICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpXG5cbiAgICAgICAgaG9yaXpvbnRhbFJ1bGUgPSBnLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAuYXR0cihcIngxXCIsIDApXG4gICAgICAgICAgLmF0dHIoXCJ4MlwiLCB3aWR0aCkgXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTJcIiwgaGVpZ2h0KVxuICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAnJydcblxuICAgICMjIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVyc1xuICAgIGNoYXJ0LndpZHRoID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHdpZHRoIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB3aWR0aCA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuaGVpZ2h0ID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIGhlaWdodCBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgaGVpZ2h0ID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5tYXJnaW4gPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbWFyZ2luIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBtYXJnaW4gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LmF4aXNwb3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gYXhpc3BvcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgYXhpc3BvcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueGxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG54dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG54dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnh0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG55dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG55dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucmVjdGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHJlY3Rjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcmVjdGNvbG9yID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50Y29sb3IgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50c2l6ZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHNpemUgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c2l6ZSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzdHJva2UgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRzdHJva2UgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c3Ryb2tlID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGFiID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsYWIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsYWIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geWxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeWxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHZhciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dmFyIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4dmFyID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geXNjYWxlXG5cbiAgICBjaGFydC54c2NhbGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHhzY2FsZVxuXG4gICAgY2hhcnQucG9pbnRzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBwb2ludHNTZWxlY3RcblxuICAgIGNoYXJ0LmxhYmVsc1NlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGFiZWxzU2VsZWN0XG5cbiAgICBjaGFydC5sZWdlbmRTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIGxlZ2VuZFNlbGVjdFxuXG4gICAgY2hhcnQudmVydGljYWxSdWxlID0gKCkgLT5cbiAgICAgIHJldHVybiB2ZXJ0aWNhbFJ1bGVcblxuICAgIGNoYXJ0Lmhvcml6b250YWxSdWxlID0gKCkgLT5cbiAgICAgIHJldHVybiBob3Jpem9udGFsUnVsZVxuXG4gICAgIyByZXR1cm4gdGhlIGNoYXJ0IGZ1bmN0aW9uXG4gICAgY2hhcnRcblxuICBnZXRDb2xvcnMgPSAoaSkgLT5cbiAgICBjb2xvcnMgPSBbXCJMaWdodEdyZWVuXCIsIFwiTGlnaHRQaW5rXCIsIFwiTGlnaHRTa3lCbHVlXCIsIFwiTW9jY2FzaW5cIiwgXCJCbHVlVmlvbGV0XCIsIFwiR2FpbnNib3JvXCIsIFwiRGFya0dyZWVuXCIsIFwiRGFya1R1cnF1b2lzZVwiLCBcIm1hcm9vblwiLCBcIm5hdnlcIiwgXCJMZW1vbkNoaWZmb25cIiwgXCJvcmFuZ2VcIiwgIFwicmVkXCIsIFwic2lsdmVyXCIsIFwidGVhbFwiLCBcIndoaXRlXCIsIFwiYmxhY2tcIl1cbiAgICByZXR1cm4gY29sb3JzW2ldXG5cbiAgZ2V0U3Ryb2tlQ29sb3IgPSAoaSkgLT5cbiAgICBzY29sb3JzID0gW1wiYmxhY2tcIiwgXCJ3aGl0ZVwiLCBcImdyYXlcIiwgXCJicm93blwiLCBcIk5hdnlcIl1cbiAgICByZXR1cm4gc2NvbG9yc1tpXVxuXG4gICMgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHJvdW5kaW5nIG9mIGF4aXMgbGFiZWxzXG4gIGZvcm1hdEF4aXMgPSAoZCkgLT5cbiAgICBkID0gZFsxXSAtIGRbMF1cbiAgICBuZGlnID0gTWF0aC5mbG9vciggTWF0aC5sb2coZCAlIDEwKSAvIE1hdGgubG9nKDEwKSApXG4gICAgbmRpZyA9IDAgaWYgbmRpZyA+IDBcbiAgICBuZGlnID0gTWF0aC5hYnMobmRpZylcbiAgICBkMy5mb3JtYXQoXCIuI3tuZGlnfWZcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFkZW9mZnNUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJoYWJpdGF0c1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwiaXNTa2V0Y2hcIixjLHAsMSksYyxwLDAsMTMsNjIxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGg0PkhhYml0YXRzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGg+UGVyY2VudCB3aXRoaW4gU2tldGNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNrZXRjaF9oYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwyNTcsMzYxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfVFlQRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI1XFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHAgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzU2tldGNoXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5IYWJpdGF0czwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc0ludGFuZ2libGVzXCIsYyxwLDEpLGMscCwwLDczNywxMTc2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgIDxkaXYgY2xhc3M9XFxcImxpc3QtaGVhZGVyXFxcIj5UaGUgaW50YW5naWJsZSB6b25lcyB3aXRoaW4gdGhpcyBwcm9wb3NhbCBpbmNsdWRlIHRoZSBmb2xsb3dpbmcgaGFiaXRhdHM6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPlBlcmNlbnQgd2l0aGluIFNrZXRjaDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbnRhbmdpYmxlX2hhYml0YXRzXCIsYyxwLDEpLGMscCwwLDEwMzAsMTEzNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzU3VzdGFpbmFibGVcIixjLHAsMSksYyxwLDAsMTIyMCwxNjY2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgIDxkaXYgY2xhc3M9XFxcImxpc3QtaGVhZGVyXFxcIj5UaGUgc3VzdGFpbmFibGUgdXNlIHpvbmVzIHdpdGhpbiB0aGlzIHByb3Bvc2FsIGluY2x1ZGUgdGhlIGZvbGxvd2luZyBoYWJpdGF0czo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGg+UGVyY2VudCB3aXRoaW4gU2tldGNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInN1c3RhaW5hYmxlX2hhYml0YXRzXCIsYyxwLDEpLGMscCwwLDE1MTksMTYyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzTWl4ZWRVc2VcIixjLHAsMSksYyxwLDAsMTcwNywyMTQzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgIDxkaXYgY2xhc3M9XFxcImxpc3QtaGVhZGVyXFxcIj5UaGUgbWl4ZWQgdXNlIHpvbmVzIHdpdGhpbiB0aGlzIHByb3Bvc2FsIGluY2x1ZGUgdGhlIGZvbGxvd2luZyBoYWJpdGF0czo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGg+UGVyY2VudCB3aXRoaW4gU2tldGNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1peGVkX3VzZV9oYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwxOTk4LDIxMDIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzRXh0cmFjdGl2ZVwiLGMscCwxKSxjLHAsMCwyMTg0LDI2MjcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgPGRpdiBjbGFzcz1cXFwibGlzdC1oZWFkZXJcXFwiPlRoZSBleHRyYWN0aXZlIHVzZSB6b25lcyB3aXRoaW4gdGhpcyBwcm9wb3NhbCBpbmNsdWRlIHRoZSBmb2xsb3dpbmcgaGFiaXRhdHM6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPlBlcmNlbnQgd2l0aGluIFNrZXRjaDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJleHRyYWN0aXZlX2hhYml0YXRzXCIsYyxwLDEpLGMscCwwLDI0ODEsMjU4NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDE3LDU4NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5TaXplIChpbiBzcXVhcmUga2lsb21ldGVycyk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGg+Wm9uZSBUeXBlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPlRvdGFsIEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGg+TWVhbiBBcmVhPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPk1pbi4gQXJlYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aD5NYXguIEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2l6ZV9zdGF0c1wiLGMscCwxKSxjLHAsMCwzNTMsNTQ3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJaT05FX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUT1RBTFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk1FQU5cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJNSU5cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJNQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlx0PGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5UaGUgc2VsZWN0ZWQgc2tldGNoIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2l6ZV9rbVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUga2lsb21ldGVyczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1widHJhZGVvZmZzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VHJhZGVvZmZzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0PHNlbGVjdCBjbGFzcz1cXFwiY2hvc2VuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0PGxhYmVsPlNlbGVjdCBhIFNldCBvZiBUcmFkZW9mZiBTY29yZXMgdG8gVmlldzo8L2xhYmVsPjwvYnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdDxvcHRpb24gY2xhc3M9XFxcImRlZmF1bHQtY2hvc2VuLXNlbGVjdGlvblxcXCIgbGFiZWw9XFxcIlByZXNlcnZhdGlvbiBhbmQgVG91cmlzbVxcXCI+PC9vcHRpb24+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInRyYWRlb2Zmc1wiLGMscCwxKSxjLHAsMCwyNDEsMjg0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdFx0XHQ8b3B0aW9uIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcdDwvc2VsZWN0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgPHAgY2xhc3M9XFxcInNtYWxsIHR0aXAtdGlwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgIFRpcDogaG92ZXIgb3ZlciBhIHByb3Bvc2FsIHRvIHNlZSBkZXRhaWxzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgaWQ9XFxcInB2dF9jb250YWluZXJcXFwiIGNsYXNzPVxcXCJwdnRfY29udGFpbmVyXFxcIj48ZGl2ICBpZD1cXFwicHJlcy12LXRvdXJpc21cXFwiIGNsYXNzPVxcXCJwcmVzLXYtdG91cmlzbVxcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgaWQ9XFxcInB2ZV9jb250YWluZXJcXFwiIGNsYXNzPVxcXCJwdmVfY29udGFpbmVyXFxcIj48ZGl2ICBpZD1cXFwicHJlcy12LWV4dHJhY3RpdmVcXFwiIGNsYXNzPVxcXCJwcmVzLXYtZXh0cmFjdGl2ZVxcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgaWQ9XFxcInR2ZV9jb250YWluZXJcXFwiIGNsYXNzPVxcXCJ0dmVfY29udGFpbmVyXFxcIj48ZGl2ICBpZD1cXFwidG91cmlzbS12LWV4dHJhY3RpdmVcXFwiIGNsYXNzPVxcXCJ0b3VyaXNtLXYtZXh0cmFjdGl2ZVxcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSJdfQ==
