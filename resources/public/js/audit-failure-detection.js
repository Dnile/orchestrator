
$(document).ready(function () {
    showLoader();
    var uri = "/api/audit-failure-detection/"+currentPage();
    if (detectionId() > 0) {
    	uri = "/api/audit-failure-detection/id/"+detectionId();
    }
    $.get(uri, function (auditEntries) {
        $.get("/api/replication-analysis-changelog", function (analysisChangelog) {
        	displayAudit(auditEntries, analysisChangelog);
        }, "json");
    }, "json");
    function displayAudit(auditEntries, analysisChangelog) {
    	var changelogMap = {}
    	analysisChangelog.forEach(function (changelogEntry) {
    		changelogMap[getInstanceId(changelogEntry.AnalyzedInstanceKey.Hostname, changelogEntry.AnalyzedInstanceKey.Port)] = changelogEntry.Changelog;
    	});
    	
        hideLoader();
        auditEntries.forEach(function (audit) {
        	var analyzedInstanceDisplay = audit.AnalysisEntry.AnalyzedInstanceKey.Hostname+":"+audit.AnalysisEntry.AnalyzedInstanceKey.Port;
    		var row = jQuery('<tr/>');
    		var moreInfoElement = $('<span class="more-detection-info pull-right glyphicon glyphicon-info-sign text-primary" title="More info"></span>');
    		moreInfoElement.attr("data-detection-id", audit.Id);

    		$('<td/>', { text: audit.AnalysisEntry.Analysis }).prepend(moreInfoElement).appendTo(row);
    		$('<a/>',  { text: analyzedInstanceDisplay, href: "/web/search/" + analyzedInstanceDisplay }).wrap($("<td/>")).parent().appendTo(row);
    		$('<td/>', { text: audit.AnalysisEntry.CountSlaves }).appendTo(row);
    		$('<a/>',  { text: audit.AnalysisEntry.ClusterDetails.ClusterName, href: "/web/cluster/"+audit.AnalysisEntry.ClusterDetails.ClusterName}).wrap($("<td/>")).parent().appendTo(row);
    		$('<a/>',  { text: audit.AnalysisEntry.ClusterDetails.ClusterAlias, href: "/web/cluster/alias/"+audit.AnalysisEntry.ClusterDetails.ClusterAlias}).wrap($("<td/>")).parent().appendTo(row);
    		$('<td/>', { text: audit.RecoveryStartTimestamp }).appendTo(row);

    		var moreInfo = "";
    		moreInfo += '<div>Detected: '+audit.RecoveryStartTimestamp+'</div>';
    		if (audit.AnalysisEntry.SlaveHosts.length > 0) {
    			moreInfo += '<div>'+audit.AnalysisEntry.CountSlaves+' slave hosts :<ul>';
        		audit.AnalysisEntry.SlaveHosts.forEach(function(instanceKey) {
        			moreInfo += "<li><code>"+getInstanceTitle(instanceKey.Hostname, instanceKey.Port)+"</code></li>";    			
        		});
        		moreInfo += "</ul></div>";
    		}
    		var changelog = changelogMap[getInstanceId(audit.AnalysisEntry.AnalyzedInstanceKey.Hostname, audit.AnalysisEntry.AnalyzedInstanceKey.Port)];
    		if (changelog) {
    			moreInfo += '<div>Changelog :<ul>';
    			changelog.split(",").reverse().forEach(function(changelogEntry) {
    				var changelogEntryTokens = changelogEntry.split(';');
    				var changelogEntryTimestamp = changelogEntryTokens[0];
    				var changelogEntryAnalysis = changelogEntryTokens[1];

    				if (changelogEntryTimestamp > audit.RecoveryStartTimestamp) {
    					// This entry is newer than the detection time; irrelevant
    					return;
    				}
        			moreInfo += "<li><code>"+changelogEntryTimestamp + " <strong>" + changelogEntryAnalysis + "</strong></code></li>";
        		});
        		moreInfo += "</ul></div>";
    		}
    		moreInfo += '<div><a href="/web/audit-recovery/id/' + audit.RelatedRecoveryId + '">Related recovery</a></div>';    		
    		
    		moreInfo += "<div>Proccessed by <code>"+audit.ProcessingNodeHostname+"</code></div>";    		
    		row.appendTo('#audit tbody');
    		
    		var row = $('<tr/>');
			row.attr("data-detection-id-more-info", audit.Id);
			row.addClass("more-info");
    		$('<td colspan="6"/>').append(moreInfo).appendTo(row);
    		row.hide().appendTo('#audit tbody');
    	});
        if (auditEntries.length == 1) {
        	$("[data-detection-id-more-info]").show();
        }
        if (currentPage() <= 0) {
        	$("#audit .pager .previous").addClass("disabled");
        }
        if (auditEntries.length == 0) {
        	$("#audit .pager .next").addClass("disabled");        	
        }
        $("#audit .pager .previous").not(".disabled").find("a").click(function() {
            window.location.href = "/web/audit-failure-detection/"+(currentPage() - 1);
        });
        $("#audit .pager .next").not(".disabled").find("a").click(function() {
            window.location.href = "/web/audit-failure-detection/"+(currentPage() + 1);
        });
        $("#audit .pager .disabled a").click(function() {
            return false;
        });
        $("body").on("click", ".more-detection-info", function (event) {
        	var detectionId = $(event.target).attr("data-detection-id");
            $('[data-detection-id-more-info='+detectionId+']').slideToggle();        
        });
    }
});	
